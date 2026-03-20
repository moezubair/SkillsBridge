@echo off
setlocal
cd /d "%~dp0"

set "SKILLSBRIDGE=%~dp0.."
set "PYLOT=%SKILLSBRIDGE%\.lotushack\Scripts\python.exe"
set "PYVENV=%~dp0venv\Scripts\python.exe"

if exist "%PYLOT%" (
  echo Using: %PYLOT%
  "%PYLOT%" main.py
  exit /b %ERRORLEVEL%
)
if exist "%PYVENV%" (
  echo Using: %PYVENV%
  "%PYVENV%" main.py
  exit /b %ERRORLEVEL%
)

echo Using: python on PATH
python main.py
exit /b %ERRORLEVEL%
