@echo off
setlocal
cd /d "%~dp0"
echo Installing CampusFind dependencies...
call npm install
if errorlevel 1 goto failed
call npm --prefix backend install
if errorlevel 1 goto failed
call npm --prefix frontend install
if errorlevel 1 goto failed
echo.
echo Setup complete. Run start.bat to launch CampusFind.
pause
exit /b 0
:failed
echo.
echo Setup failed. Check that Node.js and npm are installed and that you have an internet connection.
pause
exit /b 1
