@echo off
rem Abre a parte do EloTask que corre no PC, cada uma na sua janela:
rem servidor (3000), servico de IA (8000) e frontend (5501).
rem Na primeira vez instala as dependencias (demora um pouco).
cd /d "%~dp0"
start "servidor :3000" cmd /k "cd servidor && npm install --no-audit --no-fund && npm start"
start "ia_service :8000" cmd /k "cd ia_service && py -m pip install -q -r requirements.txt && py -m uvicorn app.main:app --port 8000"
start "frontend :5501" cmd /k "py -m http.server 5501 --directory ..\Frontend"
