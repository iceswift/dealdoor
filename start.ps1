# start.ps1 - DealDoor Local Server

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DealDoor - Local Development Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Build
Write-Host "[1/2] Building project..." -ForegroundColor Yellow
pnpm build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/2] Starting server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Server running at:" -ForegroundColor Green
Write-Host "  http://localhost:4321" -ForegroundColor White
Write-Host ""
Write-Host "  Pages:" -ForegroundColor Green
Write-Host "  - Landing:    http://localhost:4321/" -ForegroundColor White
Write-Host "  - Explore:    http://localhost:4321/explore" -ForegroundColor White
Write-Host "  - Dashboard:  http://localhost:4321/dashboard" -ForegroundColor White
Write-Host "  - Onboarding: http://localhost:4321/onboarding" -ForegroundColor White
Write-Host ""
Write-Host "  Shop pages:" -ForegroundColor Green
Write-Host "  - http://localhost:4321/moon-bowl-cafe" -ForegroundColor White
Write-Host "  - http://localhost:4321/aroi-noodle-house" -ForegroundColor White
Write-Host "  - http://localhost:4321/glow-hair-studio" -ForegroundColor White
Write-Host ""
Write-Host "  Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

node dist/server/entry.mjs
