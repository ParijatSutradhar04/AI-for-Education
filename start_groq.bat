@echo off
setlocal enabledelayedexpansion
echo ==========================================
echo   Starting AI Education Assistant (Groq)
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

REM Set Groq backend directly
set "backend_file=backend_groq.py"
set "backend_name=Groq Backend (Llama)"
set "backend_type=Real Groq/Llama Integration"

echo ✅ Using Groq backend with Llama model.
echo.

echo ==========================================
echo      Starting Backend and Frontend
echo ==========================================
echo.
echo 🦙 Backend Mode: %backend_type%
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
