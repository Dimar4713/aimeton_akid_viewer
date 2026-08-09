@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo AIMETON AKID Viewer - Windows unblock helper
echo.

set "FOUND="
for %%F in (AIMETON_AKID_Viewer_*_Windows_x64.exe) do (
  set "FOUND=1"
  set "TARGET=%%~fF"
  echo Unblocking: %%~nxF
  powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "try { Unblock-File -LiteralPath $env:TARGET -ErrorAction Stop; exit 0 } catch { Write-Error $_; exit 1 }"
  if errorlevel 1 (
    echo ERROR: Could not unblock %%~nxF
    echo Try: Right click EXE ^> Properties ^> Unblock ^> Apply
    pause
    exit /b 1
  )
)

if not defined FOUND (
  echo ERROR: AIMETON AKID Viewer EXE was not found in this folder.
  echo Put this BAT file next to AIMETON_AKID_Viewer_*_Windows_x64.exe and run it again.
  pause
  exit /b 2
)

echo.
echo Done. Windows Internet-zone blocking was removed from the Viewer EXE.
echo You can now start the EXE normally.
pause
exit /b 0
