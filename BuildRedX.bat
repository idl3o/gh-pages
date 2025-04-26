@echo off
echo Running RED X Build Script...
cd %~dp0\red_x
powershell -ExecutionPolicy Bypass -File ".\Run-RedX.ps1" -Mode build -Verbose
pause
