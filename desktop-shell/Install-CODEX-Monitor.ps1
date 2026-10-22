$ErrorActionPreference = 'Stop'
$source = $PSScriptRoot
$install = Join-Path $env:LOCALAPPDATA 'Programs\CODEX Monitor'
$desktop = [Environment]::GetFolderPath([Environment+SpecialFolder]::DesktopDirectory)
$programs = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'
$menuFolder = Join-Path $programs 'CODEX Monitor'
$exe = Join-Path $install 'CODEX Monitor.exe'
if (-not (Test-Path -LiteralPath (Join-Path $source 'CODEX Monitor.exe'))) { throw 'Run this installer from the distributable folder containing CODEX Monitor.exe.' }
$running = Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -eq 'CODEX | Token Usage Dashboard' }
if ($running) { throw 'Close CODEX Monitor before installing an update.' }
New-Item -ItemType Directory -Path $install,$menuFolder -Force | Out-Null
Copy-Item -Path (Join-Path $source '*') -Destination $install -Recurse -Force
$shortcutShell = New-Object -ComObject WScript.Shell
function New-CodexShortcut([string]$path) {
  $shortcut = $shortcutShell.CreateShortcut($path)
  $shortcut.TargetPath = $exe
  $shortcut.WorkingDirectory = $install
  $shortcut.IconLocation = "$exe,0"
  $shortcut.Description = 'Local CODEX token usage dashboard'
  $shortcut.Save()
}
$desktopLink = Join-Path $desktop 'CODEX MONITOR.lnk'
if (Test-Path -LiteralPath $desktopLink) {
  $existing = $shortcutShell.CreateShortcut($desktopLink)
  if ($existing.TargetPath -ne $exe) {
    $backup = Join-Path $desktop 'CODEX MONITOR.before-native.lnk'
    if (-not (Test-Path -LiteralPath $backup)) { Copy-Item -LiteralPath $desktopLink -Destination $backup }
  }
}
New-CodexShortcut $desktopLink
New-CodexShortcut (Join-Path $menuFolder 'CODEX Monitor.lnk')
$uninstallKey = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\Aeru-CODEX-Monitor'
New-Item -Path $uninstallKey -Force | Out-Null
New-ItemProperty -Path $uninstallKey -Name DisplayName -Value 'CODEX Monitor' -PropertyType String -Force | Out-Null
New-ItemProperty -Path $uninstallKey -Name DisplayVersion -Value '1.0.0' -PropertyType String -Force | Out-Null
New-ItemProperty -Path $uninstallKey -Name Publisher -Value 'Aeru' -PropertyType String -Force | Out-Null
New-ItemProperty -Path $uninstallKey -Name DisplayIcon -Value "$exe,0" -PropertyType String -Force | Out-Null
$uninstall = 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "' + $install + '\Uninstall-CODEX-Monitor.ps1"'
New-ItemProperty -Path $uninstallKey -Name UninstallString -Value $uninstall -PropertyType String -Force | Out-Null
Write-Output "Installed CODEX Monitor to $install"
Write-Output 'Shortcuts added to the Desktop and Start menu.'