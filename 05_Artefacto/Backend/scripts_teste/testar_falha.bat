@echo off
rem Mede a tolerancia a falhas: desliga o servidor do Docker com 120 pedidos a correr,
rem conta os que falham e mede o tempo ate voltar a responder.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0testar_falha.ps1"
pause
