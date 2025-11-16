@echo off
setlocal enabledelayedexpansion

echo === ChatGPT Atlas Desktop Startup ===

REM Check Python environment
echo.
echo Checking Python environment...
if not exist ".venv" (
    echo Creating Python virtual environment...
    python -m venv .venv
)

call .venv\Scripts\activate.bat

echo Installing Python dependencies...
pip install -q -r requirements.txt

echo Python environment ready

REM Check Node environment
echo.
echo Checking Node.js environment...
where node >nul 2>nul
if errorlevel 1 (
    echo Error: Node.js not found. Please install Node.js 14+ from https://nodejs.org/
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo Found Node.js %NODE_VERSION%

cd electron_app

if not exist "node_modules" (
    echo Installing Node dependencies...
    call npm install
) else (
    echo Node dependencies already installed
)

echo Node.js environment ready

REM Check if Python bridge is running
echo.
echo Checking if Python bridge is running...
netstat -ano | findstr ":8000" >nul 2>nul

if errorlevel 1 (
    echo Starting Python bridge in background...
    cd ..
    start /B python agent_bridge.py > nul 2>&1
    timeout /t 2 /nobreak
    
    REM Verify bridge is running
    netstat -ano | findstr ":8000" >nul 2>nul
    if errorlevel 1 (
        echo Error: Failed to start Python bridge
        exit /b 1
    )
    cd electron_app
) else (
    echo Python bridge already running on localhost:8000
)

echo.
echo === Starting Electron App ===
call npm start
