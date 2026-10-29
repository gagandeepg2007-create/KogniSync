@echo off
echo Starting KogniSync Backend on http://127.0.0.1:8000...
cd /d "%~dp0\..\backend"
set PYTHONPATH=%cd%
"..\.venv\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
