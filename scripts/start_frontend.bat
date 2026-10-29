@echo off
echo Starting KogniSync Frontend on http://localhost:5173...
cd /d "%~dp0\..\frontend"
npx vite --host 0.0.0.0 --port 5173
pause
