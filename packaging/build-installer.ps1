# Builds the Codex Usage HUD Windows setup file from the packaged desktop app.
#   dist-desktop\            : output of desktop-shell\Build-Desktop.ps1 (run that first)
#   packaging\stage\         : the files the installer carries (git-ignored)
#   releases\CodexUsageHUD-Setup-v<version>.exe
# Needs NSIS (makensis). Pass its path with -Makensis, or put makensis on PATH.
param(
  [string]$Version = '0.2.0',
  [string]$Makensis = ''
)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$dist = Join-Path $root 'dist-desktop'
$stage = Join-Path $PSScriptRoot 'stage'
$releases = Join-Path $root 'releases'
$setupName = "CodexUsageHUD-Setup-v$Version.exe"
$setup = Join-Path $releases $setupName

if (-not $Makensis) { $found = Get-Command makensis.exe -ErrorAction SilentlyContinue; if ($found) { $Makensis = $found.Source } }
if (-not $Makensis -or -not (Test-Path -LiteralPath $Makensis)) { throw 'NSIS (makensis.exe) was not found. Pass -Makensis <path>.' }
if (-not (Test-Path -LiteralPath (Join-Path $dist 'CODEX Monitor.exe'))) { throw 'dist-desktop is missing. Run desktop-shell\Build-Desktop.ps1 first.' }

# 1. Copy the app files the installer needs. Developer-only files stay out.
$excluded = @('CODEX Monitor.pdb', 'CODEX Monitor.exe - Shortcut.lnk', 'Install-CODEX-Monitor.ps1', 'Setup-CODEX-Monitor.cmd', 'README-DESKTOP.md')
if (Test-Path -LiteralPath $stage) { Remove-Item -LiteralPath $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage | Out-Null
Get-ChildItem -LiteralPath $dist -Force | Where-Object { $excluded -notcontains $_.Name -and $_.Extension -ne '.xml' } | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination $stage -Recurse -Force
}
# Uninstall is handled by the setup file itself, so the PowerShell uninstaller is not shipped.
Remove-Item -LiteralPath (Join-Path $stage 'Uninstall-CODEX-Monitor.ps1') -Force -ErrorAction SilentlyContinue

# 2. Notices that must accompany the installed copies.
Copy-Item -LiteralPath (Join-Path $root 'THIRD_PARTY_NOTICES.md') -Destination (Join-Path $stage 'THIRD_PARTY_NOTICES.md') -Force
Copy-Item -LiteralPath (Join-Path $root 'LICENSE') -Destination (Join-Path $stage 'LICENSE') -Force
$legal = Join-Path $stage 'legal'
New-Item -ItemType Directory -Path $legal -Force | Out-Null
$nugetRoot = Join-Path $env:USERPROFILE '.nuget\packages'
$csprojText = Get-Content -Raw -LiteralPath (Join-Path $root 'desktop-shell\DesktopShell.csproj')
$wv2Version = [regex]::Match($csprojText, 'Include="Microsoft\.Web\.WebView2" Version="([^"]+)"').Groups[1].Value
if (-not $wv2Version) { throw 'WebView2 package version not found in DesktopShell.csproj.' }
$wv2Dir = Join-Path $nugetRoot "microsoft.web.webview2\$wv2Version"
foreach ($name in 'LICENSE.txt', 'NOTICE.txt') {
  $src = Join-Path $wv2Dir $name
  if (-not (Test-Path -LiteralPath $src)) { throw "WebView2 $name not found in $wv2Dir" }
  Copy-Item -LiteralPath $src -Destination (Join-Path $legal ('WebView2-' + $name)) -Force
}
$coreLibVersion = ((Get-Item -LiteralPath (Join-Path $stage 'System.Private.CoreLib.dll')).VersionInfo.ProductVersion -split '\+')[0]
$dotnetDir = Join-Path $nugetRoot "microsoft.netcore.app.runtime.win-x64\$coreLibVersion"
foreach ($pair in @(@('LICENSE.TXT', 'dotnet-LICENSE.txt'), @('THIRD-PARTY-NOTICES.TXT', 'dotnet-THIRD-PARTY-NOTICES.txt'))) {
  $src = Join-Path $dotnetDir $pair[0]
  if (-not (Test-Path -LiteralPath $src)) { throw ".NET runtime $($pair[0]) not found in $dotnetDir" }
  Copy-Item -LiteralPath $src -Destination (Join-Path $legal $pair[1]) -Force
}
Write-Output "Notices staged: WebView2 $wv2Version, .NET runtime $coreLibVersion"

# 3. Privacy audit: no personal records, credentials, debug symbols or developer paths may ship.
$problems = @()
Get-ChildItem -LiteralPath $stage -Recurse -File | ForEach-Object {
  $rel = $_.FullName.Substring($stage.Length + 1)
  if ($_.Name -match '(?i)\.pdb$|\.jsonl$|\.sqlite|\.db$|^\.env|auth\.json|credentials|\.log$|\.tmp$|snapshot|ledger') { $problems += "Forbidden file: $rel" }
  if ($_.Extension -in '.js', '.json', '.html', '.css', '.md', '.txt', '.bat', '.cmd', '.ps1') {
    $text = [IO.File]::ReadAllText($_.FullName)
    if ($text -match '(?i)C:\\Users\\|C:\\AI-services' -or ($env:USERNAME -and $text -match [regex]::Escape($env:USERNAME))) { $problems += "Personal or developer path in: $rel" }
  }
}
if ($problems.Count -gt 0) { $problems | ForEach-Object { Write-Output $_ }; throw 'Privacy audit failed. The installer was not built.' }
Write-Output 'Privacy audit passed.'

# 4. Compile the setup file.
New-Item -ItemType Directory -Path $releases -Force | Out-Null
& $Makensis "/DSTAGE_DIR=$stage" "/DOUT_FILE=$setup" "/DAPP_VERSION=$Version" (Join-Path $PSScriptRoot 'installer.nsi')
if ($LASTEXITCODE -ne 0) { throw 'NSIS build failed.' }
Write-Output ("Built {0} ({1} bytes)" -f $setup, (Get-Item -LiteralPath $setup).Length)
