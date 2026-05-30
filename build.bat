@echo off
cd /d "%~dp0"
echo Running npm install...
call npm install
echo Building HRKonek web application...
call npm run build
echo.
echo Build complete! You can now run HRKonek.exe to start the server.
pause
