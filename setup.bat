@echo off
echo ==========================================
echo    AI Chatbot Backend Setup Script
echo ==========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://python.org
    pause
    exit /b 1
)

echo ✓ Python is installed
echo.

REM Check if pip is available
pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: pip is not available
    pause
    exit /b 1
)

echo ✓ pip is available
echo.

REM Check if virtual environment exists
if exist ".venv" (
    echo ✓ Virtual environment already exists
) else (
    echo Creating virtual environment...
    python -m venv .venv
    if %errorlevel% neq 0 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
    echo ✓ Virtual environment created successfully
)
echo.

REM Activate virtual environment
echo Activating virtual environment...
call .venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)

echo ✓ Virtual environment activated
echo.

REM Install requirements
echo Installing Python dependencies...
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ✓ Dependencies installed successfully
echo.
echo ==========================================
echo        Setup Complete!
echo ==========================================
echo.
echo To start the backend server, run:
echo     run_backend.bat
echo.
echo Or manually:
echo     .venv\Scripts\activate.bat
echo     python test_backend.py
echo.
echo Then open index.html in your browser
echo.
pause
