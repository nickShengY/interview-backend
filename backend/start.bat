@echo off
echo ========================================
echo Starting ATS Backend Server
echo ========================================
echo.

REM Check if virtual environment exists
if not exist ".venv311\Scripts\activate.bat" (
    echo Creating virtual environment...
    python -m venv .venv311
)

REM Activate virtual environment
call .venv311\Scripts\activate.bat

REM Install/update dependencies
echo Installing dependencies...
pip install -r requirements.txt --quiet

REM Load environment variables from parent directory
if exist "..\\.env" (
    echo Loading environment variables...
    for /f "tokens=*" %%a in ('type "..\\.env"') do (
        set "%%a"
    )
)

echo.
echo ========================================
echo Backend server starting on port 8000
echo API Documentation: http://localhost:8000/docs
echo Health Check: http://localhost:8000/health
echo ========================================
echo.

REM Start the server
uvicorn main:app --reload --port 8000
