@echo off
setlocal

php artisan migrate:fresh --seed

if %errorlevel% neq 0 (
    echo.
    echo Hiba tortent a migrate:fresh --seed futtatasa kozben.
    exit /b %errorlevel%
)

echo.
echo Sikeres migrate:fresh --seed.
endlocal
