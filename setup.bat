@echo off
echo ==========================================
echo   AI Education Assistant Setup Script
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
python --version
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
echo This includes Flask, OpenAI, PDF processing, and other required packages...
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    echo Trying with --upgrade flag...
    pip install --upgrade -r requirements.txt
    if %errorlevel% neq 0 (
        echo ERROR: Installation failed. Please check your internet connection.
        pause
        exit /b 1
    )
)

echo.
echo ✓ Dependencies installed successfully
echo.

REM Test imports
echo Testing package imports...
python -c "import flask, flask_cors, openai, fitz, PIL, dotenv; print('✓ All packages working correctly!')" 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  Some packages may not be working correctly, but continuing...
) else (
    echo ✓ All packages verified working
)
echo.

REM Create directories
echo Creating necessary directories...
if not exist "uploads" mkdir uploads
if not exist "temp_images" mkdir temp_images
echo ✓ Directories created
echo.

echo ==========================================
echo        Setup Complete!
echo ==========================================
echo.
echo 🎓 AI Education Assistant is ready to use!
echo.
echo To start the application:
echo     start_app.bat
echo.
echo Available backends:
echo   1. 🤖 AI Backend (Real ChatGPT - requires OpenAI API key)
echo   2. 🧪 Test Backend (Mock responses - no API key needed)
echo.
echo Features ready:
echo   ✅ Web interface with responsive mobile design
echo   ✅ PDF upload and processing
echo   ✅ Multi-language support
echo   ✅ Class level customization
echo   ✅ Educational context processing
echo.
echo For AI backend, you'll need an OpenAI API key from:
echo https://platform.openai.com/api-keys
echo.
pause
