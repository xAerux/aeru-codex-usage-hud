<p align="center">
  <img src="assets/codex-monitor-master.png" width="200" alt="CODEX Monitor logo">
</p>

<h1 align="center">⚡ AERU CODEX USAGE HUD</h1>

<p align="center">
  <b>📊 Your Codex Tokens. Your Usage. Your Dashboard.</b><br>
  A Windows AI Usage Utility by Aeru Creations
</p>

<p align="center">
  <img alt="Version 0.2.0" src="https://img.shields.io/badge/version-0.2.0-00E5FF?style=for-the-badge">
  <img alt="Platform Windows" src="https://img.shields.io/badge/platform-Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white">
  <img alt="License MIT" src="https://img.shields.io/badge/license-MIT-FFD700?style=for-the-badge&logoColor=black">
  <img alt="Status unreleased" src="https://img.shields.io/badge/status-unreleased-6E7681?style=for-the-badge">
</p>

---

Ever wondered where all your Codex tokens went? 🤔 This local neon dashboard reads the Codex history already on your computer and turns it into totals, charts, and project breakdowns. No cloud dashboard, no sign-up page, and your session files never leave your machine. Just your numbers, glowing in green. 💚

## ✨ What It Does

- 📈 **Token totals** for today, your history, and daily averages, with cache hit rate.
- 💵 **Estimated cost** in US dollars, with a ¥ reference figure.
- 🗓️ **One-week usage view** so you can see the spikes.
- 🏆 **Top 3 projects** ranked by total token use.
- 🧠 **Model proportion** showing which models you use most.
- ⭐ **Highlights** such as your highest-cost day, peak output day, and best cache session.
- 🦙 **Local Ollama totals** when the Qwen/Ollama adapter is installed.
- 🪟 **Desktop window** for the packaged app, so it does not live in a browser tab.

## 🧮 How Codex Tracking Works

1. The HUD reads the Codex session files in `~/.codex/sessions` and `archived_sessions` (JSONL).
2. It adds up each turn's `last_token_usage` delta. Cumulative `total_token_usage` totals are never added on top, so nothing is counted twice.
3. Duplicate Codex response IDs are counted once.
4. The **combined total** is your online ChatGPT Codex account lifetime summary (when available) plus local Ollama tokens.
5. Codex session history still shows project and model details, but it is not added to the combined total, because those GPT sessions are already part of the account count.

Point the HUD at a different Codex folder with the `AERU_CODEX_DIR` environment variable (see the Paths section below).

## 🚀 Installation

This repository does not include a prebuilt installer. Choose one of the two methods below.

### Option 1: Run from the folder (any Windows PC)

1. Install **Node.js 18 or newer** from https://nodejs.org.
2. Double-click **`Start Dashboard.bat`** in this folder. It starts the local server and opens the dashboard.

Or, from a terminal in this folder:

```bash
npm start
```

This opens `http://127.0.0.1:8787`. If that port is busy, the next free port up to +9 is used.

```bash
npm start -- --no-open
npm start -- --sample
```

`--no-open` starts the server without opening a browser. `--sample` shows the reference layout, even when your Codex folders are empty.

### Option 2: Desktop app (Windows, native window)

The desktop shell lives in `desktop-shell/`. From the project root, build the packaged app with:

```bash
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\desktop-shell\Build-Desktop.ps1
```

The packaged folder `dist-desktop/` is generated locally by that script and is not stored in this repository.

- Run `dist-desktop\CODEX Monitor.exe` directly, or
- Double-click `Setup-CODEX-Monitor.cmd` inside that folder to install for your Windows user, with Desktop and Start Menu shortcuts.
- To remove an installed copy, run `Uninstall-CODEX-Monitor.ps1` from the installed folder. It removes the app files and shortcuts, and leaves your `.codex` folder alone.

### Requirements

- **Windows** (the desktop app and the installer scripts are Windows-only).
- **Node.js 18+** for Option 1. The desktop package carries its own Node runtime.
- **Microsoft Edge WebView2 Runtime** for the desktop app. Windows 11 normally includes it; on Windows 10 install it once from Microsoft.
- **Optional:** the Codex CLI, signed in with ChatGPT, for the online account summary.
- **Optional:** the local Qwen/Ollama adapter, for local Ollama totals.

## 🛠️ Paths

```powershell
# Windows PowerShell
$env:AERU_CODEX_DIR = "$env:USERPROFILE\.codex"
```

```bash
# macOS / Linux
AERU_CODEX_DIR="$HOME/.codex" npm start
```

## 🔐 Privacy and Local Data

- 🏠 **Local only.** The server listens on `127.0.0.1` only. It is not reachable from other computers on your network.
- 📂 **Your files stay put.** Session files, Ollama adapter captures and prompts are read on your computer and are not uploaded by this app. From adapter captures, the HUD reads only numeric usage fields and model identifiers.
- 🔑 **No credential access.** This app does not read or copy Codex credentials. For the optional account summary, it asks the local Codex app-server (`account/usage/read`), and the app-server uses your existing Codex sign-in.
- 🪟 **Locked-down desktop window.** The desktop app only loads pages from `127.0.0.1`.
- 🙈 **Repository hygiene.** `.gitignore` excludes Codex session folders, JSONL files, and database files.
- 📸 **Screenshots show your numbers.** Before you share a screenshot of the dashboard, remember it shows your real usage figures and project names.

## ⚠️ Known Limitations

- 💲 **Costs are estimates**, based on public API list prices checked in October 2026. They are not your ChatGPT subscription invoice.
- 🧩 **Claude Code usage is not tracked** by this HUD. It covers Codex and local Ollama.
- 🧪 **Unknown models** use a fallback rate of $2 input, $0.20 cached input, and $8 output per million tokens.
- 🔏 **Not code-signed.** The packaged desktop app is unsigned, so Windows may show a security warning. Only run it from a source you trust.
- 🏷️ **Version metadata.** The desktop shell's project file still carries version 1.0.0 while this release is 0.2.0. It will be aligned in the next package.
- 🪙 **The ¥ figure** is a fixed reference (CNY 7.20 per USD), not a live exchange rate.

## 🐛 Feedback and Bug Reports

Found a bug, or have an idea?

Open an issue in this repository and include:

- Your Windows version and Node.js version (if you used Option 1)
- The steps that lead to the problem
- Whether you used `--sample` or your real Codex folder

Please do not post session files, prompts, or other personal usage data. 🙏

## 📜 License

This project is released under the **MIT License**. See [LICENSE](LICENSE) for the full text.

Copyright (c) 2026 AERU.

Bundled third-party components keep their own licences. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for details.

## 🙌 Third-Party Branding & Disclaimer

Aeru Codex Usage HUD is an independently developed software project by Aeru Creations.

Third-party product names, trademarks, logos, and associated branding remain the property of their respective owners.

This project is not affiliated with, sponsored by, or endorsed by OpenAI, Microsoft, or any other third-party provider unless expressly stated otherwise.

References to Codex and other products identify compatibility or usage-data sources.

The project's MIT License applies only to material covered by that license. Third-party components and assets remain subject to their own terms and permissions.

A disclaimer does not itself grant permission to redistribute third-party assets.

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for the bundled components, their notices, and the open items.

## 💜 About Aeru Creations

Aeru Creations builds useful software, AI tools, and desktop applications that put more capability and control into the hands of everyday users. 🚀

Yes, the dashboard is green. Yes, that is on purpose. 😎

If this HUD helps you see your tokens clearly, please **star the repository** ⭐

<p align="center"><b>⚡ IMAGINE IT. I PRODUCE IT.</b></p>
