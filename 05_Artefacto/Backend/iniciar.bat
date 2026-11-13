@echo off
rem Abre o servidor e o servico de IA do EloTask, cada um na sua janela.
rem Na primeira vez instala as dependencias (demora um pouco).
cd /d "%~dp0"
start "servidor :3000" cmd /k "cd servidor && npm install --no-audit --no-fund && npm start"
start "ia_service :8000" cmd /k "cd ia_service && py -m pip install -q -r requirements.txt && py -m uvicorn app.main:app --port 8000"
