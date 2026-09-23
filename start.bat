@echo off
chcp 65001 >nul
title Aptechnyi ahrehator - Rivne
cd /d "%~dp0"

rem Open browser 2 seconds after server start
start "" /b cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000"

echo ============================================
echo   Aptechnyi ahrehator: http://localhost:3000
echo   Zakryty: Ctrl+C abo prosto zakryi vikno
echo ============================================
node server.js
pause
