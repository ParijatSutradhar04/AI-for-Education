@echo off
setlocal enabledelayedexpansion
echo ==========================================
echo    Starting AI Education Assistant
echo ==========================================
echo.

REM Check if virtual environment exists
if not exist ".venv" (
    echo ERROR: Virtual environment not found!
    echo Please run setup.bat first to create the virtual environment.
    pause
    exit /b 1
)

echo Activating virtual environment...
call .venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)

echo ✓ Virtual environment activated
echo.

REM Backend Selection Menu
echo ==========================================
echo         Choose Backend Mode
echo ==========================================
echo.
echo 1. 🤖 AI Backend (Real ChatGPT - Requires OpenAI API Key)
echo 2. 🧪 Test Backend (Mock responses - No API Key needed)
echo.
set /p "backend_choice=Enter your choice (1 or 2): "

if "%backend_choice%"=="1" (
    set "backend_file=backend.py"
    set "backend_name=AI Backend"
    set "backend_type=Real ChatGPT Integration"
    
    REM Check for OpenAI API Key
    if "%OPENAI_API_KEY%"=="" (
        echo.
        echo ⚠️  WARNING: OPENAI_API_KEY not found!
        echo.
        echo 💡 To configure your API key:
        echo    1. Open the .env file in this directory
        echo    2. Replace 'your_openai_api_key_here' with your actual API key
        echo    3. Get your API key from: https://platform.openai.com/api-keys
        echo    4. Restart this script
        echo.
        set /p "api_key=Or enter your OpenAI API key now (or press Enter to continue anyway): "
        if not "!api_key!"=="" (
            set OPENAI_API_KEY=!api_key!
            echo ✅ API key set for this session.
        ) else (
            echo ❌ No API key provided. Backend will run but AI features won't work.
        )
        echo.
    ) else (
        echo ✅ OpenAI API key detected.
    )
) else if "%backend_choice%"=="2" (
    set "backend_file=test_backend.py"
    set "backend_name=Test Backend"
    set "backend_type=Mock Responses"
    echo ✅ Using test backend with mock responses.
) else (
    echo Invalid choice. Defaulting to Test Backend.
    set "backend_file=test_backend.py"
    set "backend_name=Test Backend"
    set "backend_type=Mock Responses"
)

echo.
echo ==========================================
echo      Starting Backend and Frontend
echo ==========================================
echo.
echo 🤖 Backend Mode: %backend_type%
echo 🚀 Backend will be available at:
echo     http://localhost:5000
echo.
echo 🌐 Frontend will be available at:
echo     http://localhost:5599
echo.
echo 📱 Open this URL in your browser:
echo     http://localhost:5599/
echo.
echo Press Ctrl+C to stop both servers
echo.
echo ==========================================

REM Start backend server in background
echo Starting %backend_name%...
start "%backend_name%" cmd /c "python %backend_file%"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend server in foreground
echo Starting frontend server...
echo.
python start_frontend.py

echo.
echo ==========================================
echo Both servers have been stopped.
echo ==========================================
pause
