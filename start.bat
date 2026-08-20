@echo off
title Scrum Canvas
cd /d "%~dp0"

set PORT=%SCRUM_CANVAS_PORT%
if "%PORT%"=="" set PORT=4173

start "" cmd /c "timeout /t 2 /nobreak >nul & start http://127.0.0.1:%PORT%"
node server/index.cjs

echo.
echo Scrum Canvas stopped.
pause
