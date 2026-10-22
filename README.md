<img width="1686" height="1242" alt="CODEX MONITOR" src="https://github.com/user-attachments/assets/3fe55354-994a-4bcf-b7ba-e1c0507c3162" />
# CODEX TOKEN USAGE DASHBOARD

Local neon HUD for Codex token history that already lives on this computer.

Codex reads `~/.codex/sessions` and `archived_sessions`. Turns are summed from `last_token_usage` (the per-turn delta). Cumulative `total_token_usage` is not added on top of that.

Nothing is uploaded. The server binds to `127.0.0.1` only. Prompts are not shown.

## Run
CODEX Monitor Shortcut
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
