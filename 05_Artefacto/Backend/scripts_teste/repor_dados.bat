@echo off
rem Repoe a base de dados com os dados de demonstracao (01 + 02 + 03 de base_dados).
rem Corre na BD do Docker; a replicacao copia para o MAMP. Apaga tudo o que foi criado em testes.
cd /d "%~dp0.."
if not exist "%~dp0logs" mkdir "%~dp0logs"
set LOG=%~dp0logs\repor_dados.log
echo Copia de seguranca em logs\copia_antes_de_repor.sql > "%LOG%"
docker compose exec -T db sh -c "mysqldump -uroot -p$MYSQL_ROOT_PASSWORD --set-gtid-purged=OFF --no-tablespaces elotask 2>/dev/null" > "%~dp0logs\copia_antes_de_repor.sql"
echo A apagar e recriar a base de dados... >> "%LOG%"
docker compose exec -T db sh -c "mysql -uroot -p$MYSQL_ROOT_PASSWORD -e 'DROP DATABASE IF EXISTS elotask; CREATE DATABASE elotask CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci' 2>&1" >> "%LOG%" 2>&1
for %%F in (01_elotask.sql 02_palavras_passe.sql 03_dados_apresentacao.sql) do (
  echo A carregar %%F... >> "%LOG%"
  docker compose exec -T db sh -c "mysql -uroot -p$MYSQL_ROOT_PASSWORD --default-character-set=utf8mb4 elotask 2>&1" < base_dados\%%F >> "%LOG%" 2>&1
)
docker compose exec -T db sh < "%~dp0verificar.sh" >> "%LOG%" 2>&1
type "%LOG%"
pause
