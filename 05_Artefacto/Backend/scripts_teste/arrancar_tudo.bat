@echo off
rem Arranca o EloTask todo: as 3 janelas do PC (iniciar.bat) e os contentores do Docker.
rem Antes: MAMP com Start Servers e Docker Desktop aberto.
cd /d "%~dp0.."
call iniciar.bat
cd /d "%~dp0.."
echo A arrancar o Docker (a primeira vez demora alguns minutos)...
docker compose up -d --build
docker compose ps
pause
