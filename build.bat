@echo off
cd /d "%~dp0"

:: ── Auto-configure .env from .env.example ──────
if not exist ".env" (
    if exist ".env.example" (
        echo Setting up .env with your project path...
        setlocal enabledelayedexpansion
        set "RAW_PATH=%~dp0"
        set "RAW_PATH=!RAW_PATH:\=/!"
        set "FULL_PATH=!RAW_PATH!prisma/dev.db"
        powershell -Command "(Get-Content '.env.example') -replace 'C:/path/to/your/project/hrkonek/prisma/dev.db', '!FULL_PATH!' | Set-Content '.env' -Encoding utf8"
        echo .env created.
        endlocal
    )
)

echo Running npm install...
call npm install
echo Generating Prisma client...
call npx prisma generate
echo Pushing database schema...
call npx prisma db push
echo Building HRKonek web application...
call npm run build
echo.
echo Build complete! You can now run HRKonek.exe to start the server.
pause
