@echo off
echo ========================================
echo Storage Buddy Bot - Diagnostics
echo ========================================
echo.

echo [1/5] Checking Docker version...
docker --version
docker compose version
echo.

echo [2/5] Checking services status...
docker compose ps
echo.

echo [3/5] Checking PostgreSQL logs (last 30 lines)...
docker compose logs postgres --tail 30
echo.

echo [4/5] Checking container health...
docker inspect storage-buddy-postgres --format="Health Status: {{.State.Health.Status}}" 2>nul
echo.

echo [5/5] Checking system resources...
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
echo.

echo ========================================
echo Diagnostics complete!
echo.
echo If you see errors, check TROUBLESHOOTING-POSTGRES.md
echo ========================================
pause
