@echo off
setlocal
cd /d "%~dp0"
if not exist "backend\node_modules" (
  echo Dependencies are missing. Run setup.bat first.
  pause
  exit /b 1
)
if not exist "frontend\node_modules" (
  echo Dependencies are missing. Run setup.bat first.
  pause
  exit /b 1
)
call npm run dev
