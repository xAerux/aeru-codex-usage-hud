; Codex Usage HUD per-user installer.
; Built by packaging\build-installer.ps1, which passes STAGE_DIR, OUT_FILE and APP_VERSION.
; Installs to %LOCALAPPDATA%\Programs\Codex Usage HUD, separate from any earlier CODEX Monitor install.
; Uninstall removes program files and the shortcuts created here. It never removes %LOCALAPPDATA%\Aeru (the WebView2 profile) or %USERPROFILE%\.codex.

Unicode true
RequestExecutionLevel user
SetCompressor /SOLID lzma

!include "LogicLib.nsh"
!include "FileFunc.nsh"

!ifndef APP_VERSION
  !define APP_VERSION "0.2.0"
!endif
!ifndef STAGE_DIR
  !error "STAGE_DIR must be passed with /DSTAGE_DIR=..."
!endif
!ifndef OUT_FILE
  !error "OUT_FILE must be passed with /DOUT_FILE=..."
!endif

!define APP_NAME "Codex Usage HUD"
!define APP_EXE "CODEX Monitor.exe"
!define UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\Aeru-CodexUsageHUD"

Name "${APP_NAME}"
OutFile "${OUT_FILE}"
InstallDir "$LOCALAPPDATA\Programs\${APP_NAME}"
InstallDirRegKey HKCU "${UNINST_KEY}" "InstallLocation"
ShowInstDetails show
Caption "${APP_NAME} ${APP_VERSION} Setup"

VIProductVersion "${APP_VERSION}.0"
VIAddVersionKey "ProductName" "${APP_NAME}"
VIAddVersionKey "CompanyName" "Aeru Creations"
VIAddVersionKey "FileDescription" "${APP_NAME} setup"
VIAddVersionKey "FileVersion" "${APP_VERSION}.0"
VIAddVersionKey "LegalCopyright" "Copyright (c) 2026 AERU"

Page directory
Page instfiles
UninstPage uninstConfirm
UninstPage instfiles

Section "Install"
  ; A running copy keeps its executable locked. If it cannot be removed, stop before copying anything.
  IfFileExists "$INSTDIR\${APP_EXE}" 0 install_now
    Delete "$INSTDIR\${APP_EXE}"
    IfFileExists "$INSTDIR\${APP_EXE}" 0 install_now
      IfSilent +3 0
      MessageBox MB_ICONEXCLAMATION|MB_OK "Please close ${APP_NAME} before installing or updating it, then run Setup again."
      SetErrorLevel 2
      Abort
  install_now:
  SetOutPath "$INSTDIR"
  File /r "${STAGE_DIR}\*.*"
  WriteUninstaller "$INSTDIR\Uninstall ${APP_NAME}.exe"

  WriteRegStr HKCU "${UNINST_KEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINST_KEY}" "DisplayName" "${APP_NAME}"
  WriteRegStr HKCU "${UNINST_KEY}" "DisplayVersion" "${APP_VERSION}"
  WriteRegStr HKCU "${UNINST_KEY}" "Publisher" "Aeru Creations"
  WriteRegStr HKCU "${UNINST_KEY}" "DisplayIcon" "$INSTDIR\${APP_EXE},0"
  WriteRegStr HKCU "${UNINST_KEY}" "UninstallString" '"$INSTDIR\Uninstall ${APP_NAME}.exe"'
  WriteRegDWORD HKCU "${UNINST_KEY}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINST_KEY}" "NoRepair" 1

  ; Shortcuts are skipped only for automated test installs (/NOSHORTCUTS).
  ClearErrors
  ${GetParameters} $R0
  ${GetOptions} $R0 "/NOSHORTCUTS" $R1
  IfErrors 0 skip_shortcuts
    CreateShortCut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\${APP_EXE}" "" "$INSTDIR\${APP_EXE}" 0 SW_SHOWNORMAL "" "Local Codex token usage dashboard"
    CreateDirectory "$SMPROGRAMS\${APP_NAME}"
    CreateShortCut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" "$INSTDIR\${APP_EXE}" "" "$INSTDIR\${APP_EXE}" 0 SW_SHOWNORMAL "" "Local Codex token usage dashboard"
    CreateShortCut "$SMPROGRAMS\${APP_NAME}\Uninstall ${APP_NAME}.lnk" "$INSTDIR\Uninstall ${APP_NAME}.exe"
  skip_shortcuts:
SectionEnd

Section "Uninstall"
  Delete "$DESKTOP\${APP_NAME}.lnk"
  Delete "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk"
  Delete "$SMPROGRAMS\${APP_NAME}\Uninstall ${APP_NAME}.lnk"
  RMDir "$SMPROGRAMS\${APP_NAME}"

  RMDir /r "$INSTDIR"
  DeleteRegKey HKCU "${UNINST_KEY}"
SectionEnd
