@echo off
rem Abre os 4 servicos do EloTask, cada um na sua janela.
cd /d "%~dp0"
start "ia_service :8000" cmd /k "cd ia_service && py -m uvicorn app.main:app --port 8000"
start "ia_turnos :8001" cmd /k "cd ia_turnos && py -m uvicorn main:app --port 8001"
start "backend_principal :3000" cmd /k "cd backend_principal && npm start"
start "backend_comunicacao :3002" cmd /k "cd backend_comunicacao && npm start"
