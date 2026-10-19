# AERU CODEX USAGE HUD
<img width="1686" height="1242" alt="CODEX MONITOR" src="https://github.com/user-attachments/assets/c5c59363-a072-4ec2-b361-bad6c7852265" />
> A compact, local-first dashboard for usage statistics found in your local OpenAI Codex history.

<!-- Screenshot placeholder: add an anonymized dashboard screenshot here before public release. -->

## Privacy first

This app reads session metadata and token-usage records from the current user's `%USERPROFILE%\.codex` folder. It runs an HTTP server bound only to `127.0.0.1`, makes no network requests, has no telemetry or analytics, and never uploads, syncs, or modifies Codex data. Prompts and session text are not displayed in the dashboard.

## Requirements

- Node.js 18 or newer
- A local Codex installation with a `.codex` history folder
- 
No API keys. No additional subscriptions. No cloud account.
CODEX reads your existing local Codex usage history and turns it into a real-time visual dashboard with token statistics, project breakdowns, model usage, cache performance, and estimated API-equivalent costs.

## Run locally

From this project folder:

```powershell
npm start
```

The dashboard opens at `http://127.0.0.1:8787`. If that port is in use, the app tries the next available port up to `8787 + 9`.

Once published to npm, the intended launch command is:

```powershell
npx aeru-codex-usage-hud
```

No package has been published by this repository.

## Development

```powershell
npm run check
node server.js --no-open
```

Set `AERU_CODEX_DIR` only if automatic discovery of `%USERPROFILE%\.codex` is not appropriate:

```powershell
$env:AERU_CODEX_DIR = 'D:\other-profile\.codex'
npm start
```

## What it reads

The parser inspects only local `sessions/**/*.jsonl` and `archived_sessions/**/*.jsonl` rollout files when present. It derives token totals, input/output/cache counts, dates, model labels, and the final folder name of a workspace. Malformed records are skipped safely.

It does **not** read or publish SQLite databases, authentication data, API keys, prompts, assistant messages, or full filesystem paths for normal dashboard display.

## Dashboard

- Lifetime total, input, output, cache rate, estimated API-equivalent cost, and daily average
- A rolling seven-calendar-day chart with weekday-and-date labels and hover totals
- The top three projects only
- Model proportions directly below projects
- Four concise lifetime highlights
- A manual refresh that rescans only the local machine

## Cost estimate disclaimer

The API-equivalent cost is an indicative calculation, **not** an OpenAI subscription bill or invoice. It uses a clearly defined reference rate table in `usage.js` (uncached input $2.00/M, cached input $0.20/M, output $8.00/M) and may differ from current, historical, bundled, or model-specific pricing. Review and adjust that table before relying on it for financial decisions.

## Known limitations

- Local Codex rollout formats can change. The parser intentionally ignores records it cannot safely interpret.
- Usage is based on available local history, not an account-wide cloud ledger.
- Session deduplication uses response IDs when available and session IDs when assembling the dashboard.
- Project attribution comes from recorded working directories; sessions without one are grouped as `Unattributed`.


## License

[MIT](LICENSE)
