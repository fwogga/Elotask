#!/bin/sh
# Liga a base de dados do Docker (db) à do PC (MAMP).
# Na primeira vez copia a base de dados do PC para o Docker; depois o Docker passa a
# copiar todas as alterações do PC. O sentido contrário (PC copia do Docker) configura-se
# uma vez no MAMP (ver docker-compose.yml).
set -e

PC="-h host.docker.internal -P 3306 -ureplicacao -p$REPLICACAO_PASSWORD"
DOCKER="-h db -uroot -p$DB_PASSWORD"

# Utilizadores da aplicação e da replicação (fora do binlog: cada base de dados cria os seus)
mysql $DOCKER -e "
  SET SESSION sql_log_bin = 0;
  CREATE USER IF NOT EXISTS 'elotask'@'%' IDENTIFIED BY '$DB_APP_PASSWORD';
  GRANT ALL ON elotask.* TO 'elotask'@'%';
  CREATE USER IF NOT EXISTS 'replicacao'@'%' IDENTIFIED BY '$REPLICACAO_PASSWORD';
  GRANT REPLICATION SLAVE ON *.* TO 'replicacao'@'%';"

if [ -z "$(mysql $DOCKER -N -e "SHOW DATABASES LIKE 'elotask'")" ]; then
  echo "A copiar a base de dados do PC para o Docker..."
  mysqldump $PC --databases elotask --single-transaction --no-tablespaces --set-gtid-purged=ON \
    --triggers --routines --events | mysql $DOCKER
fi

if [ -z "$(mysql $DOCKER -N -e 'SHOW SLAVE STATUS')" ]; then
  mysql $DOCKER -e "
    CHANGE MASTER TO MASTER_HOST='host.docker.internal', MASTER_PORT=3306,
      MASTER_USER='replicacao', MASTER_PASSWORD='$REPLICACAO_PASSWORD', MASTER_AUTO_POSITION=1;
    START SLAVE;"
  echo "O Docker passa a copiar as alterações do PC"
else
  echo "O Docker já copia as alterações do PC"
fi
