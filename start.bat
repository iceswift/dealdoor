# start.bat - DealDoor Local Server

@echo off
echo ========================================
echo   DealDoor - Local Development Server
echo ========================================
echo.

echo [1/2] Building project...
call pnpm build
if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo [2/2] Starting server...
echo.
echo ========================================
echo   Server running at:
echo   http://localhost:4321
echo.
echo   Pages:
echo   - Landing:    http://localhost:4321/
echo   - Explore:    http://localhost:4321/explore
echo   - Dashboard:  http://localhost:4321/dashboard
echo   - Onboarding: http://localhost:4321/onboarding
echo.
echo   Shop pages:
echo   - http://localhost:4321/moon-bowl-cafe
echo   - http://localhost:4321/aroi-noodle-house
echo   - http://localhost:4321/glow-hair-studio
echo.
echo   Press Ctrl+C to stop
echo ========================================
echo.

bun dist/server/entry.mjs
