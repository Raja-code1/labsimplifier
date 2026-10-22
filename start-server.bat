@echo off
title LabSimplifier Python Server
echo.
echo  =============================================
echo   LabSimplifier — Python Student Database
echo   Server starting at http://127.0.0.1:5000
echo  =============================================
echo.
cd /d "%~dp0"
python server.py
pause
