# CODEX TOKEN USAGE DASHBOARD

Local neon HUD for Codex token history that already lives on this computer.

Codex reads `~/.codex/sessions` and `archived_sessions`. Turns are summed from `last_token_usage` (the per-turn delta). Cumulative `total_token_usage` is not added on top of that. When a compatible Codex app-server and a ChatGPT sign-in are available, the HUD requests the account lifetime summary through Codex's `account/usage/read` method. If the local Qwen/Ollama adapter is installed at `~/.codex/local14b-tool-adapter`, the HUD also reads token counts from its `captures` folder. The combined total is paid ChatGPT Codex account lifetime plus local Ollama usage. Codex session history is shown for project and model details, but is not added to the combined total because its GPT sessions overlap the online account count.

The server binds to `127.0.0.1` only. Local session files, adapter captures, and prompts stay on the computer. The optional account summary request is sent by the local Codex app-server to OpenAI using the user's existing Codex sign-in. If Codex is missing, signed out, or too old to support the method, the HUD falls back to local history and adapter totals where available. Adapter captures include model response content; the HUD parses only numeric usage fields and model identifiers.

## Run

On Windows, double-click **Start Dashboard.bat** in this folder. Do not open `public\index.html` by itself. That file is only the page. The `.bat` starts the program and opens the dashboard.

You need Node.js 18 or newer: https://nodejs.org

Or from this folder:

```bash
npm start
```

Opens `http://127.0.0.1:8787`. If that port is taken, the next free port up to +9 is used.

```bash
npm start -- --no-open
npm run check
```

`npm start -- --sample` shows the reference layout even when both folders are empty.

## Paths

```bash
# Windows PowerShell
$env:AERU_CODEX_DIR = "$env:USERPROFILE\.codex"

# macOS / Linux
AERU_CODEX_DIR="$HOME/.codex" npm start
```

## Money

Dollar amounts are estimates from public API list prices (October 2026), not your ChatGPT or xAI subscription invoice. The yen figure is a fixed ×7.20 CNY reference so the board can show both currencies. Unknown models fall back to $2 / $0.20 cached / $8 per million tokens.

## License

MIT
