@echo off
rem Mostra quantos registos tem a BD do Docker e o estado da replicacao (PC -> Docker).
cd /d "%~dp0.."
docker compose exec -T db sh < "%~dp0verificar.sh"
pause
