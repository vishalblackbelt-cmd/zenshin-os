@echo off
title ZENSHIN OS v1.3 RC-1 Launcher
echo ==================================================
echo         STARTING ZENSHIN OS v1.3 RC-1...
echo ==================================================
echo.
cd /d "%~dp0"
echo [1/2] Starting Backend & Frontend Servers...
start "Zenshin OS Server Panel" cmd /k "npm run dev"
echo.
echo [2/2] Waiting 8 seconds for initialization...
timeout /t 8 >nul
echo.
echo [3/3] Opening Web Portal in your browser...
start http://localhost:3000
echo.
echo ==================================================
echo   ZENSHIN OS is now running!
echo   Please keep the "Zenshin OS Server Panel" window
echo   open to continue using the software.
echo ==================================================
pause
