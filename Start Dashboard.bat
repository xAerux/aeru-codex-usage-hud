@echo off
cd /d "%~dp0"
set "NODE="
where node >nul 2>nul && set "NODE=node"
if not defined NODE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "NODE=%ProgramFiles(x86)%\nodejs\node.exe"
if not defined NODE if exist "%LocalAppData%\Programs\nodejs\node.exe" set "NODE=%LocalAppData%\Programs\nodejs\node.exe"
if not defined NODE (
  echo Node.js was not found.
  echo Install the LTS version from https://nodejs.org
  echo Then double-click this file again.
  echo.
  pause
  exit /b 1
)
echo Starting the token dashboard...
echo Leave this window open while you use it. Closing it stops the dashboard.
echo.
"%NODE%" server.js
echo.
echo The dashboard stopped.
pause
