$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$dist = Join-Path $root 'dist-desktop'
$node = (Get-Command node.exe -ErrorAction Stop).Source
$runtime = Join-Path $dist 'runtime'
$assets = Join-Path $dist 'assets'
New-Item -ItemType Directory -Path $runtime,$assets -Force | Out-Null
dotnet publish (Join-Path $PSScriptRoot 'DesktopShell.csproj') -c Release -o $dist --verbosity minimal
Copy-Item -LiteralPath $node -Destination (Join-Path $runtime 'node.exe') -Force
Copy-Item -LiteralPath (Join-Path $root 'server.js') -Destination $dist -Force
Copy-Item -LiteralPath (Join-Path $root 'usage.js') -Destination $dist -Force
Copy-Item -LiteralPath (Join-Path $root 'codex-account-usage.js') -Destination $dist -Force
Copy-Item -LiteralPath (Join-Path $root 'local-ollama-usage.js') -Destination $dist -Force
Copy-Item -LiteralPath (Join-Path $root 'public') -Destination $dist -Recurse -Force
Copy-Item -LiteralPath (Join-Path $root 'LICENSE') -Destination $dist -Force
Copy-Item -LiteralPath (Join-Path $root 'assets') -Destination $dist -Recurse -Force
$nodeLicense = Join-Path (Split-Path $node) 'LICENSE'
if (Test-Path -LiteralPath $nodeLicense) { Copy-Item -LiteralPath $nodeLicense -Destination (Join-Path $runtime 'NODE-LICENSE.txt') -Force }
$nodeVersion = (& $node --version).Trim()
$versionText = "Bundled runtime: Node.js $nodeVersion" + [Environment]::NewLine + "Source: https://nodejs.org/"
Set-Content -LiteralPath (Join-Path $runtime 'NODE-VERSION.txt') -Value $versionText -Encoding utf8
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'node-license.txt') -Destination (Join-Path $runtime 'NODE-LICENSE.txt') -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'Install-CODEX-Monitor.ps1') -Destination $dist -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'Uninstall-CODEX-Monitor.ps1') -Destination $dist -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'README-DESKTOP.md') -Destination $dist -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'Setup-CODEX-Monitor.cmd') -Destination $dist -Force
Write-Output "Packaged CODEX Monitor to $dist with Node.js $nodeVersion"


