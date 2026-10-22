# CODEX Monitor desktop package

The native WinForms/WebView2 shell reuses the existing dashboard page and local Node server. The distributable bundles the app's self-contained .NET runtime, the Node executable, the dashboard source files, and the CODEX icon.

## Build

Run powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\desktop-shell\Build-Desktop.ps1 from the project root. The distributable is written to dist-desktop.

## Run

Double-click dist-desktop\CODEX Monitor.exe. It starts its bundled server quietly on 127.0.0.1, tries ports 8787 through 8796, and opens the existing dashboard in a native resizable window. It does not open a browser. Closing the window stops only the server process started by that app instance.

The Evergreen Microsoft Edge WebView2 Runtime must be present. Windows 11 normally includes it; it is installed on the build machine used for this package. Windows 10 systems without WebView2 need its free Microsoft runtime installed once.

If the user has the Codex CLI available and signed into ChatGPT, the dashboard asks its local app-server for the paid ChatGPT Codex account lifetime token summary. The app-server handles authentication; this package does not read or copy Codex credentials. If the local Qwen/Ollama adapter is installed under `%USERPROFILE%\.codex\local14b-tool-adapter`, the dashboard adds token counts from its local response captures to the online account lifetime. Codex local session history is used for project and model details but is not added because it contains cloud usage already counted by the account. Session files, adapter captures, and prompts remain on the computer; only numeric usage and model identifiers are read from captures. If the CLI, compatible app-server method, or ChatGPT sign-in is unavailable, the dashboard falls back to local history and Ollama captures where available.

## Install and uninstall

Double-click dist-desktop\Setup-CODEX-Monitor.cmd (or run Install-CODEX-Monitor.ps1) to install per-user, create Desktop and Start menu shortcuts, and register an uninstall entry. Run Uninstall-CODEX-Monitor.ps1 from the installed folder or Windows Apps settings to uninstall. Uninstall removes the app files and shortcuts only; it does not modify %USERPROFILE%\.codex.

The folder is the complete distributable; the EXE relies on its adjacent files and runtime folder. Codex account usage is an optional local dependency and is not bundled.
