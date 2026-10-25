# Third-Party Notices

This file identifies the third-party components used by Aeru Codex Usage HUD, the licence terms that apply to them, and the status of their notice files in the current packaged build. It is not a grant of rights.

## This project's own code

The original code of Aeru Codex Usage HUD is licensed under the MIT License. See [LICENSE](LICENSE), Copyright (c) 2026 AERU.

## Components in the packaged desktop app

These components are present in `dist-desktop/`, the folder produced by `desktop-shell/Build-Desktop.ps1`.

| Component | Version | Where it ships | Terms | Notice status in the current packaged build |
|---|---|---|---|---|
| Node.js runtime | v24.21.0 | `runtime/node.exe`, `runtime/NODE-VERSION.txt` | Node.js licence | Included: `runtime/NODE-LICENSE.txt`. The same text is kept at `desktop-shell/node-license.txt`. |
| .NET runtime (Microsoft.NETCore.App, self-contained) | 9.0.17 | The `System.*.dll`, `coreclr.dll` and related runtime files | The .NET runtime's `LICENSE.TXT` is the MIT License (.NET Foundation). `THIRD-PARTY-NOTICES.TXT` lists notices for third-party code in the runtime. | Not yet included. The packaged build needs the runtime's `LICENSE.TXT` and `THIRD-PARTY-NOTICES.TXT` copied in. |
| Microsoft WebView2 SDK | 1.0.4258.31 | `Microsoft.Web.WebView2.Core.dll`, `Microsoft.Web.WebView2.WinForms.dll`, `Microsoft.Web.WebView2.Wpf.dll`, `WebView2Loader.dll` | Microsoft's licence terms. The NuGet package includes `LICENSE.txt` and `NOTICE.txt`. | Not yet included. The packaged build needs `LICENSE.txt` and `NOTICE.txt` copied in. |

The Microsoft Edge WebView2 Runtime is a separate Microsoft prerequisite. It is not bundled with this project.

## Items to confirm

- The origin and licence of the artwork in `assets/` and the screenshot `CODEX MONITOR.png` have not been independently verified. The project owner should confirm them before any redistribution.

## Names, logos and trademarks

Codex, OpenAI, Ollama and other product names are used only to identify compatibility and usage-data sources. Those names, logos and trademarks belong to their respective owners. This project does not claim ownership of them, and it does not bundle third-party logos.

## Third-Party Branding & Disclaimer

Aeru Codex Usage HUD is an independently developed software project by Aeru Creations.

Third-party product names, trademarks, logos, and associated branding remain the property of their respective owners.

This project is not affiliated with, sponsored by, or endorsed by OpenAI, Microsoft, or any other third-party provider unless expressly stated otherwise.

References to Codex and other products identify compatibility or usage-data sources.

The project's MIT License applies only to material covered by that license. Third-party components and assets remain subject to their own terms and permissions.

A disclaimer does not itself grant permission to redistribute third-party assets.
