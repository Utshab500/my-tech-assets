# Connecting this MCP server to a client

This server speaks the **Model Context Protocol (MCP)**. That means it can only be used by clients that know how to speak MCP — and the way they do it depends on the *transport*.

If your Claude Desktop is a corporate build with custom MCP servers disabled, **you don't need to give up** — you just need to pick a different client. This doc lays out all practical paths.

---

## 1. The core constraint: transports

MCP has two main transports:

| Transport | What the client does | Needs on your machine |
| --- | --- | --- |
| **stdio** (default in `server.py`) | Spawns `python server.py` as a subprocess, talks over its stdin/stdout. | A local process. |
| **Streamable HTTP** | Hits a URL like `https://my-server.example.com/mcp`. | A publicly-reachable HTTPS endpoint. |

### Why a web chat (chat.openai.com, gemini.google.com) can't use stdio

A web chat lives in a browser tab. It has no filesystem access, can't spawn processes on your laptop, and can't `exec` anything. So **stdio is impossible for a pure web client** — if you want to reach one of these, you must switch the server to HTTP transport and host it somewhere they can reach over the internet.

---

## 2. Client compatibility matrix

| Client | Supports MCP? | Uses stdio? | Uses remote HTTP? | Notes |
| --- | --- | --- | --- | --- |
| **Claude Desktop** (personal) | ✅ | ✅ | ✅ (connectors) | Add via `claude_desktop_config.json`. |
| **Claude Desktop** (corporate / locked) | ✅ *in theory* | ❌ *admin-blocked* | ❌ *usually blocked too* | Policy wall — ask your admin, or pick another client. |
| **Claude Code CLI** | ✅ | ✅ | ✅ | `claude mcp add …`. Works out of the box with this server. |
| **MCP Inspector** | ✅ (dev tool) | ✅ | ✅ | Best way to **prove the server works** without any account/config. |
| **Cursor / Zed** (standalone editors) | ✅ | ✅ | ✅ | Built-in MCP settings; same config shape as Claude Desktop. |
| **VS Code + Continue** (extension) | ✅ | ✅ | ✅ | Config in `~/.continue/config.yaml`. |
| **VS Code + Cline** (extension) | ✅ | ✅ | ✅ | Config via in-pane UI or `cline_mcp_settings.json`. |
| **claude.ai (web)** | ✅ (Pro/Team/Enterprise) | ❌ | ✅ via custom *Connectors* | Admin must permit custom connectors. |
| **ChatGPT (web, Plus/Free)** | ❌ (no MCP) | ❌ | ❌ | No native MCP support on these tiers. |
| **ChatGPT (Business / Enterprise)** | ✅ | ❌ | ✅ via remote MCP connectors | Rolling out; check your admin console. |
| **Gemini (web)** | ❌ | ❌ | ❌ | No user-facing "add MCP server" option today. Use its API + Extensions instead. |

---

## 3. Easiest local paths (no corporate approval needed)

### Option A — MCP Inspector (dev loop, 30 seconds)

Best for **verifying the server itself** before worrying about clients:

```bash
cd custom-mcp-server
source .venv/bin/activate
npx @modelcontextprotocol/inspector python server.py
```

Opens a browser UI. Click `health_check`, hit **Call Tool**. Then `add_user` with a sample JSON body. Done.

### Option B — Claude Code CLI (daily driver)

If you have `claude` installed:

```bash
claude mcp add crud -- \
  /absolute/path/to/custom-mcp-server/.venv/bin/python \
  /absolute/path/to/custom-mcp-server/server.py
```

Then in any Claude Code chat, run `/mcp` to list servers, and the `health_check` / `add_user` tools become callable.

### Option C — Cursor / Zed (standalone editors with built-in MCP)

Each has its own MCP settings file, but the shape is the same as Claude Desktop (command + args + optional env). Point it at `.venv/bin/python server.py`.

- **Cursor**: *Settings* → *MCP* → *Add new MCP server*, or edit `~/.cursor/mcp.json`.
- **Zed**: edit `~/.config/zed/settings.json` under `"context_servers"`.

### Option D — VS Code AI extensions (Continue, Cline)

Both are free, open-source VS Code extensions that act as AI chat / agent panes **and speak MCP**. They differ in style:

| | **Continue** | **Cline** (fka Claude Dev) |
| --- | --- | --- |
| IDE | VS Code + JetBrains | VS Code only |
| License | Open source (Apache 2.0) | Open source (Apache 2.0) |
| Style | Chat + inline autocomplete + agent | Agent-first (plan → act → edit files → run commands) |
| Models | BYO — Anthropic, OpenAI, Ollama, Gemini, local, anything | BYO — same list + Bedrock, OpenRouter |
| MCP setup | Config file | Config file **or** in-pane UI |
| Feels like | VS Code Copilot++ | A junior dev pair-programming with you |

**Rule of thumb**: pick **Cline** while you're still *learning MCP* — its UI shows each tool call, inputs, and the response in real time, which is a fantastic feedback loop. Switch to **Continue** for lighter day-to-day use.

#### Wiring `crud_mcp` into Continue

1. Install the **Continue** extension from the VS Code Marketplace, open the chat pane, pick a model.
2. Edit `~/.continue/config.yaml` (Continue 1.0+) and add:

   ```yaml
   mcpServers:
     - name: crud
       command: /absolute/path/to/custom-mcp-server/.venv/bin/python
       args:
         - /absolute/path/to/custom-mcp-server/server.py
       env:
         API_BASE_URL: http://localhost:3001/api
   ```

   (Older installs use `~/.continue/config.json` with the same keys inside `"mcpServers": [...]`.)
3. Reload VS Code. Ask the chat something like *"ping the health endpoint"* — Continue picks `health_check` on its own.

#### Wiring `crud_mcp` into Cline

Cline has a UI for this — easier than hand-editing config.

1. Install the **Cline** extension from the VS Code Marketplace, open its pane, pick a model.
2. Click the **MCP Servers** icon at the top of the Cline pane → **Installed** → **Configure MCP Servers**. In the `cline_mcp_settings.json` that opens, add:

   ```json
   {
     "mcpServers": {
       "crud": {
         "command": "/absolute/path/to/custom-mcp-server/.venv/bin/python",
         "args": ["/absolute/path/to/custom-mcp-server/server.py"],
         "env": {
           "API_BASE_URL": "http://localhost:3001/api"
         },
         "disabled": false,
         "autoApprove": ["health_check"]
       }
     }
   }
   ```

   `autoApprove` lets listed tools fire without a confirmation prompt. Put **read-only** tools there; **never** put `add_user` (it's a write).
3. **Save** the file (the live location on macOS is `~/.cline/data/settings/cline_mcp_settings.json`, but you don't need to open it directly — Cline's UI button writes to it for you). Cline hot-reloads the config. In the MCP Servers panel you should now see:

   - `crud` with a **green** status dot.
   - Both tools listed: `health_check` and `add_user`.

   **If the status is red or orange**, click `crud` to see the stderr from the subprocess. Usual causes:

   - Wrong `python` path — must point at `.venv/bin/python`, not system `python3`, or `mcp` / `httpx` / `pydantic` won't import.
   - Backend API isn't running on `localhost:3001` (start it first).
   - Typo in the JSON (missing comma, unquoted key).

   **Smoke-test in a new Cline chat.** Do the read-only tool first — it's in `autoApprove`, so it fires without a prompt:

   > *"Run the `health_check` tool on the `crud` MCP server."*

   You should see the response envelope inline: `{"ok": true, "status_code": 200, "body": "OK!"}`.

   **Then try the write**:

   > *"Add a user named John Doe with email `john@example.com` and no assigned tasks."*

   Cline drafts the `add_user` call, shows you the JSON body it's about to POST, and **waits for your approval** before firing (because `add_user` is intentionally *not* in `autoApprove`). Approve → you see the API's response. If both calls return `"ok": true`, the full chain Cline → MCP server → REST API is live.

#### Shared gotchas

- **Use absolute paths** for `command` and `args` — both extensions launch the subprocess without your shell's `cd`.
- **Point `command` at `.venv/bin/python`**, not system `python3`, or it won't find `mcp` / `httpx` / `pydantic`.
- **Backend API must be running** on `localhost:3001` first, otherwise `health_check` returns the "Could not connect" error envelope.
- **Secrets**: if `API_BASE_URL` later points at a staging URL that needs auth, put the token in the `env` block of the config — not in `server.py`.

---

## 4. Going remote (for web clients that *do* allow custom connectors)

If your target is **claude.ai (Pro+)** or **ChatGPT Business/Enterprise**, you need the server reachable over HTTPS.

### Step 1 — Switch transport

In `server.py`:

```python
if __name__ == "__main__":
    # Default stdio for local clients:
    # mcp.run()
    # Streamable HTTP for remote clients:
    mcp.run(transport="streamable_http", port=8000)
```

### Step 2 — Expose it on HTTPS

Dev / demo:

```bash
ngrok http 8000
# -> https://<random>.ngrok-free.app
```

Production: put it behind a small VM / Fly.io / Render / Cloud Run with TLS (Let's Encrypt).

### Step 3 — Add auth

**The moment the server is public, anyone on the internet can call `add_user`.** At minimum, add a shared bearer token checked in middleware before FastMCP dispatches tools. Rotate it. Don't commit it.

### Step 4 — Register the connector

- **claude.ai** → *Settings* → *Connectors* → *Add custom connector* → paste `https://.../mcp` → paste bearer token.
- **ChatGPT Business/Enterprise** → admin console → *Connectors* → *Add remote MCP*.

---

## 5. Which path should I pick?

| Situation | Pick |
| --- | --- |
| "I just want to see it work." | §3A — MCP Inspector. |
| "I want to chat with it from a terminal daily." | §3B — Claude Code CLI. |
| "I want it inside Cursor or Zed." | §3C — standalone editors. |
| "I want it inside VS Code." | §3D — Continue (chat-style) or Cline (agent-style). |
| "I want to **see** each MCP call fire step by step while learning." | §3D — Cline (its UI shows every tool call live). |
| "I want it in claude.ai and my admin allows connectors." | §4 — go remote, register connector. |
| "Corporate Claude Desktop, no admin help coming." | §3B + §3A — Claude Code CLI + Inspector. |
