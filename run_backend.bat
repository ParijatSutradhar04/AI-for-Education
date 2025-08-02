@echo off
echo ==========================================
echo      Starting AI Chatbot Backend
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
echo Backend will be available at:
echo   http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo.
echo ==========================================

python test_backend.py
