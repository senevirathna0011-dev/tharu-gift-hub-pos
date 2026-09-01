@echo off
title Tharu Gift Hub POS System Launcher
color 0D
cls

echo ======================================================================
echo           THARU GIFT HUB - POS LAUNCHER
echo ======================================================================
echo.
echo [1/3] Initializing Point of Sale environment...
cd /d "%~dp0"

echo [2/3] Starting Next.js POS Server (npm run dev)...
start "Tharu Gift Hub POS Server" cmd /k "npm run dev"

echo [3/3] Waiting for server to initialize...
timeout /t 3 /nobreak >nul

echo.
echo Launching POS application in default web browser...
start http://localhost:3000/login

echo.
echo ======================================================================
echo   POS System is active and running at http://localhost:3000/login !
echo   Keep the server window open while operating the store terminal.
echo ======================================================================
echo.
pause
