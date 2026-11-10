# crud_mcp

A minimal **MCP server** (Python SDK v2, `MCPServer`) that wraps a small CRUD REST API (see Swagger at `http://localhost:3001/api-docs/`) as MCP tools, so an LLM client (Claude Code, MCP Inspector, Cursor, …) can call it.

> **Which client should I use?** If your corporate Claude Desktop blocks custom MCP servers, or you'd rather use ChatGPT / Gemini / claude.ai from the browser, see **[docs/connecting-clients.md](./docs/connecting-clients.md)** for the full picture of what works where and why.

## Tools

| Name | What it does | Underlying call |
| --- | --- | --- |
| `health_check` | Ping the API and return whether the service is up. | `GET  /health` |
| `add_user` | Create a user with `name`, `email`, and an optional list of `assignedTaskIds`. | `POST /add_user` |

Both tools return a small JSON envelope: `{"ok": bool, ...}` on success, or `{"ok": false, "error": "..."}` on failure.

## Prerequisites

- Python 3.10+
- The backend API running locally (default `http://localhost:3001/api`).

## Setup

```bash
cd custom-mcp-server
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # optional — only needed to override API_BASE_URL
```

## Environment

| Var | Default | Purpose |
| --- | --- | --- |
| `API_BASE_URL` | `http://localhost:3001/api` | Base URL of the backend API. |
| `TRANSPORT` | `stdio` | `stdio` for local clients (Cline, Claude Desktop, …) or `streamable-http` for remote. |
| `MCP_BEARER_TOKEN` | *(unset)* | **Required** when `TRANSPORT=streamable-http`. Shared secret that remote clients present as `Authorization: Bearer <token>`. The server refuses to boot in HTTP mode without it. |
| `HOST` | `127.0.0.1` | Bind address for HTTP mode. Default is loopback-only; ngrok still reaches it. |
| `PORT` | `8000` | TCP port for HTTP mode. |

## Run

### stdio (for Claude Desktop / Claude Code / most MCP clients)

```bash
python server.py
```

### Interactive debug with MCP Inspector

```bash
npx @modelcontextprotocol/inspector python server.py
```

Then click each tool in the left panel and try a sample call.

## Connecting an MCP client

Full guide: **[docs/connecting-clients.md](./docs/connecting-clients.md)** — covers the stdio-vs-HTTP transport story, a per-client compatibility matrix, and copy-pasteable configs for each option.

Quick picks:

- **Just want to see it work?** → [MCP Inspector](./docs/connecting-clients.md#option-a--mcp-inspector-dev-loop-30-seconds) (30 seconds, no account).
- **Daily driver in the terminal?** → [Claude Code CLI](./docs/connecting-clients.md#option-b--claude-code-cli-daily-driver) (`claude mcp add …`).
- **Inside VS Code?** → [Continue or Cline](./docs/connecting-clients.md#option-d--vs-code-ai-extensions-continue-cline).
- **In claude.ai / ChatGPT Business / Enterprise?** → [Going remote](./docs/connecting-clients.md#4-going-remote-for-web-clients-that-do-allow-custom-connectors).
- **Corporate Claude Desktop blocks custom MCP?** → [See the matrix for why, and pick a different client](./docs/connecting-clients.md#2-client-compatibility-matrix).

## Example tool calls

**Health check** — no arguments:

```json
{}
```

Response:

```json
{"ok": true, "status_code": 200, "body": "OK!"}
```

**Add user**:

```json
{
  "params": {
    "name": "John Doe",
    "email": "john@example.com",
    "assigned_task_ids": ["task_id1", "task_id2"]
  }
}
```

Response:

```json
{"ok": true, "status": true, "raw": {"status": true}}
```

## Notes

- `assigned_task_ids` is serialized to the API as `assignedTaskIds` (matching the OpenAPI schema).
- Email is validated client-side by `pydantic[email]` before the request is sent.
- All I/O is async (`httpx.AsyncClient`); the server uses the default stdio transport so it plugs straight into Claude Desktop and Claude Code.
