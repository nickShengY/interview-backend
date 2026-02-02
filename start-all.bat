@echo off
echo ========================================
echo Starting Interview Pro Application
echo ========================================
echo.

REM Start backend in a new window
echo [1/2] Starting Backend Server...
start "ATS Backend" cmd /k "cd backend && start.bat"

REM Wait a few seconds for backend to initialize
timeout /t 5 /nobreak > nul

REM Start frontend
echo [2/2] Starting Frontend...
echo.
echo ========================================
echo Application will be available at:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:8000/docs
echo ========================================
echo.
npm run dev
