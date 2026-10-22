$ErrorActionPreference = 'Stop'
$install = Join-Path $env:LOCALAPPDATA 'Programs\CODEX Monitor'
$desktop = [Environment]::GetFolderPath([Environment+SpecialFolder]::DesktopDirectory)
$menuFolder = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\CODEX Monitor'
$running = Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -eq 'CODEX | Token Usage Dashboard' }
if ($running) {
  foreach ($process in $running) { [void]$process.CloseMainWindow() }
  Start-Sleep -Seconds 2
  $stillRunning = Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -eq 'CODEX | Token Usage Dashboard' }
  if ($stillRunning) { throw 'Close CODEX Monitor and run the uninstaller again.' }
}
$desktopLink = Join-Path $desktop 'CODEX MONITOR.lnk'
Remove-Item -LiteralPath $desktopLink -Force -ErrorAction SilentlyContinue
$rollback = Join-Path $desktop 'CODEX MONITOR.before-native.lnk'
if (Test-Path -LiteralPath $rollback) { Copy-Item -LiteralPath $rollback -Destination $desktopLink -Force }
Remove-Item -LiteralPath (Join-Path $menuFolder 'CODEX Monitor.lnk') -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $menuFolder -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\Aeru-CODEX-Monitor' -Recurse -Force -ErrorAction SilentlyContinue
if (Test-Path -LiteralPath $install) { Remove-Item -LiteralPath $install -Recurse -Force }
Write-Output 'CODEX Monitor was removed. Local Codex usage history was not changed.'
