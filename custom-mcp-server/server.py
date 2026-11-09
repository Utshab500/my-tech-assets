#!/usr/bin/env python3
"""Generic CRUD MCP server.

Wraps a small REST API exposed at ``$API_BASE_URL`` (default
``http://localhost:3001/api``). Current endpoints:

- ``GET  /health``      -> health check
- ``POST /add_user``    -> create a user record in the backend DB

Run locally with::

    pip install -r requirements.txt
    python server.py            # stdio transport (for Claude Desktop, etc.)
"""

from __future__ import annotations

import json
import os
from typing import List

import httpx
from dotenv import load_dotenv
from mcp.server.mcpserver import MCPServer
from mcp.types import ToolAnnotations
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

# Load `.env` (if present) before reading any env-driven config below.
load_dotenv()

# Base URL for the backend REST API. Trailing slash is stripped so
# `_request` can safely join paths without doubling the separator.
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3001/api").rstrip("/")

# Per-request network timeout. Kept short because the wrapped API is local
# and MCP clients should fail fast rather than block a conversation.
HTTP_TIMEOUT_SECONDS = 15.0

# MCP server instance. The name "crud_mcp" is how clients
# (Claude Desktop, MCP Inspector, …) identify this server.
mcp = MCPServer("crud_mcp")


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
    # Default `mcp.run()` uses stdio transport — the standard way MCP
    # clients (Claude Desktop, Claude Code, Inspector) spawn a server.
    mcp.run()
