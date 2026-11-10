#!/usr/bin/env python3
"""Generic CRUD MCP server.

Wraps a small REST API exposed at ``$API_BASE_URL`` (default
``http://localhost:3001/api``). Current endpoints:

- ``GET  /health``      -> health check
- ``POST /add_user``    -> create a user record in the backend DB

Transport is picked at runtime from ``$TRANSPORT``:

- ``stdio`` (default) — for Claude Desktop, Claude Code, Cline, MCP Inspector.
- ``streamable-http`` — for remote clients (claude.ai connectors, etc.).
  Requires ``$MCP_BEARER_TOKEN`` so the publicly-reachable endpoint is
  not open to the internet.

Run locally with::

    pip install -r requirements.txt
    python server.py                                    # stdio
    TRANSPORT=streamable-http MCP_BEARER_TOKEN=... \\
        python server.py                                # HTTP + bearer auth
"""

from __future__ import annotations

import hmac
import json
import os
import sys
from typing import List

import httpx
from dotenv import load_dotenv
from mcp.server.auth.provider import AccessToken, TokenVerifier
from mcp.server.auth.settings import AuthSettings
from mcp.server.mcpserver import MCPServer
from mcp.types import ToolAnnotations
from pydantic import AnyHttpUrl, BaseModel, ConfigDict, EmailStr, Field, field_validator

# Load `.env` (if present) before reading any env-driven config below.
load_dotenv()

# Base URL for the backend REST API. Trailing slash is stripped so
# `_request` can safely join paths without doubling the separator.
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3001/api").rstrip("/")

# Per-request network timeout. Kept short because the wrapped API is local
# and MCP clients should fail fast rather than block a conversation.
HTTP_TIMEOUT_SECONDS = 15.0

# Transport + HTTP-mode knobs. Stdio is the safe default — only switch to
# HTTP when you need a remote client (claude.ai, etc.).
TRANSPORT = os.getenv("TRANSPORT", "stdio").lower()
HTTP_HOST = os.getenv("HOST", "127.0.0.1")
HTTP_PORT = int(os.getenv("PORT", "8000"))
MCP_BEARER_TOKEN = os.getenv("MCP_BEARER_TOKEN")


class SharedSecretTokenVerifier(TokenVerifier):
    """Constant-time bearer-token check against a single shared secret.

    Suitable for a small POC exposed via ngrok where every caller presents the
    same token. For multi-client or revocable setups, swap in a JWT/OAuth
    verifier instead (same ``TokenVerifier`` protocol).
    """

    def __init__(self, expected_token: str) -> None:
        self._expected = expected_token

    async def verify_token(self, token: str) -> AccessToken | None:
        # `hmac.compare_digest` avoids leaking the token via timing differences.
        if not hmac.compare_digest(token, self._expected):
            return None
        return AccessToken(
            token=token,
            client_id="shared-secret",
            scopes=["mcp:call"],
        )


def _build_server() -> MCPServer:
    """Construct the MCPServer, wiring bearer auth only when running over HTTP."""
    if TRANSPORT == "stdio":
        # Stdio is a local subprocess — the client already proved it has
        # permission to spawn it, so no additional auth layer is needed.
        return MCPServer("crud_mcp")

    if TRANSPORT != "streamable-http":
        raise SystemExit(
            f"TRANSPORT={TRANSPORT!r} is not supported; use 'stdio' or 'streamable-http'."
        )

    # HTTP mode: refuse to boot without a token so you can't accidentally
    # expose a write endpoint over the internet.
    if not MCP_BEARER_TOKEN:
        raise SystemExit(
            "TRANSPORT=streamable-http requires MCP_BEARER_TOKEN. "
            "Set it to a long random string (e.g. `openssl rand -hex 32`)."
        )

    base_url = AnyHttpUrl(f"http://{HTTP_HOST}:{HTTP_PORT}")
    return MCPServer(
        "crud_mcp",
        token_verifier=SharedSecretTokenVerifier(MCP_BEARER_TOKEN),
        # `issuer_url` and `resource_server_url` are OAuth-metadata fields
        # required by `AuthSettings`; for a shared-secret deployment they just
        # need to be valid URLs identifying this server. We explicitly set
        # `validate_token_resource=False` because a shared secret has no OAuth
        # audience to validate — the `SharedSecretTokenVerifier` is the final
        # arbiter of whether a token is good.
        auth=AuthSettings(
            issuer_url=base_url,
            resource_server_url=base_url,
            validate_token_resource=False,
        ),
    )


# MCP server instance. The name "crud_mcp" is how clients
# (Claude Desktop, MCP Inspector, …) identify this server.
mcp = _build_server()


class AddUserInput(BaseModel):
    """Payload for ``POST /add_user``."""

    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra="forbid",
    )

    name: str = Field(
        ...,
        description="Full name of the user to create (e.g. 'John Doe').",
        min_length=1,
        max_length=200,
    )
    email: EmailStr = Field(
        ...,
        description="User's email address (e.g. 'john@example.com').",
    )
    # `alias="assignedTaskIds"` lets callers use either the snake_case Python
    # name or the camelCase name the REST API expects on the wire.
    assigned_task_ids: List[str] = Field(
        default_factory=list,
        description=(
            "Optional list of task IDs to assign to the user on creation "
            "(e.g. ['task_id1', 'task_id2']). Pass an empty list if none."
        ),
        max_length=100,
        alias="assignedTaskIds",
    )

    @field_validator("assigned_task_ids")
    @classmethod
    def _no_empty_task_ids(cls, v: List[str]) -> List[str]:
        cleaned = [t.strip() for t in v]
        if any(not t for t in cleaned):
            raise ValueError("assigned_task_ids must not contain empty strings")
        return cleaned


async def _request(method: str, path: str, **kwargs) -> httpx.Response:
    """Shared HTTP request helper against the backend API.

    Raises ``httpx.HTTPStatusError`` on 4xx/5xx so callers can translate
    failures into a uniform JSON error envelope via ``_format_http_error``.
    """
    url = f"{API_BASE_URL}/{path.lstrip('/')}"
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT_SECONDS) as client:
        response = await client.request(method, url, **kwargs)
    response.raise_for_status()
    return response


def _format_http_error(e: Exception) -> str:
    """Translate an exception into a short, actionable error string.

    Centralised so every MCP tool returns errors in a consistent shape
    instead of leaking raw exceptions to the LLM client.
    """
    if isinstance(e, httpx.HTTPStatusError):
        status = e.response.status_code
        body = (e.response.text or "").strip()[:400]
        if status == 400:
            return f"Error: 400 Bad Request. The API rejected the payload. Body: {body}"
        if status == 404:
            return "Error: 404 Not Found. Check that the API base URL and path are correct."
        if status == 409:
            return f"Error: 409 Conflict. The resource may already exist. Body: {body}"
        if status == 500:
            return f"Error: 500 Internal Server Error from the API. Body: {body}"
        return f"Error: HTTP {status} from API. Body: {body}"
    if isinstance(e, httpx.ConnectError):
        return (
            f"Error: Could not connect to the API at {API_BASE_URL}. "
            "Is the server running and the URL correct?"
        )
    if isinstance(e, httpx.TimeoutException):
        return "Error: Request timed out. The API did not respond in time."
    return f"Error: Unexpected failure ({type(e).__name__}): {e}"


@mcp.tool(
    name="health_check",
    title="Check API health",
    annotations=ToolAnnotations(
        read_only_hint=True,
        destructive_hint=False,
        idempotent_hint=True,
        open_world_hint=True,
    ),
)
async def health_check() -> str:
    """Ping the backend API's ``/health`` endpoint.

    Use this to confirm the backend is reachable before issuing other calls.

    Returns:
        str: JSON object of shape::

            {"ok": bool, "status_code": int, "body": str}

        - ``ok`` is true when the service responded 2xx with a non-empty body.
        - ``body`` is the raw text payload (the API returns ``"OK!"`` on success).
        - On transport or HTTP errors, returns ``{"ok": false, "error": "..."}``.
    """
    # Catch-all so the MCP client always receives a JSON envelope instead of
    # a raw stack trace — network errors, timeouts, and HTTP errors all map
    # through `_format_http_error`.
    try:
        response = await _request("GET", "/health")
    except Exception as e:
        return json.dumps({"ok": False, "error": _format_http_error(e)})

    body = (response.text or "").strip()
    return json.dumps(
        {"ok": bool(body), "status_code": response.status_code, "body": body}
    )


@mcp.tool(
    name="add_user",
    title="Add a user",
    annotations=ToolAnnotations(
        read_only_hint=False,
        destructive_hint=False,
        idempotent_hint=False,
        open_world_hint=True,
    ),
)
async def add_user(params: AddUserInput) -> str:
    """Create a new user in the backend database.

    Calls ``POST /add_user`` with a JSON body of ``{name, email, assignedTaskIds}``.

    Args:
        params (AddUserInput): Validated input with fields:
            - name (str): Full name, 1-200 chars.
            - email (EmailStr): Valid email address.
            - assigned_task_ids (List[str]): Zero or more task IDs to pre-assign.
              Serialized to the API as ``assignedTaskIds``.

    Returns:
        str: JSON object of shape::

            {"ok": bool, "status": bool, "raw": <api response body>}

        where ``status`` mirrors the API's own ``status`` field (``true`` on
        success). On failure returns ``{"ok": false, "error": "..."}``.
    """
    # Explicitly use camelCase on the wire to match the REST API schema,
    # regardless of how the caller spelled the key on the Pydantic model.
    payload = {
        "name": params.name,
        "email": str(params.email),
        "assignedTaskIds": params.assigned_task_ids,
    }

    # Same catch-all pattern as `health_check`: any failure becomes a
    # structured JSON error so the LLM can reason about it.
    try:
        response = await _request("POST", "/add_user", json=payload)
    except Exception as e:
        return json.dumps({"ok": False, "error": _format_http_error(e)})

    # Guard against the API returning HTML/text on an unexpected success path.
    try:
        data = response.json()
    except ValueError:
        return json.dumps(
            {"ok": False, "error": "API returned non-JSON response", "raw": response.text}
        )

    status = bool(data.get("status", False))
    return json.dumps({"ok": status, "status": status, "raw": data})


if __name__ == "__main__":
    if TRANSPORT == "streamable-http":
        # 127.0.0.1 bind keeps the process off the open internet; ngrok/other
        # tunnels reach it via the loopback interface.
        print(
            f"Starting MCP server on http://{HTTP_HOST}:{HTTP_PORT}/mcp "
            "(bearer auth enabled).",
            file=sys.stderr,
        )
        mcp.run(transport="streamable-http", host=HTTP_HOST, port=HTTP_PORT)
    else:
        # Stdio: the standard way MCP clients (Claude Desktop, Claude Code,
        # Cline, Inspector) spawn a server as a subprocess.
        mcp.run()
