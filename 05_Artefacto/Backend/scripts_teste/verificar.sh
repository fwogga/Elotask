export MYSQL_PWD="$MYSQL_ROOT_PASSWORD"
mysql -uroot -N elotask -e "SELECT 'utilizadores', COUNT(*) FROM utilizadores UNION ALL SELECT 'tarefas', COUNT(*) FROM tarefas UNION ALL SELECT 'mensagens', COUNT(*) FROM mensagens UNION ALL SELECT 'turnos_atribuidos', COUNT(*) FROM turno_colaboradores UNION ALL SELECT 'ausencias_pendentes', COUNT(*) FROM pedidos_ausencia WHERE estado='pendente'" 2>/dev/null
mysql -uroot -e "SHOW SLAVE STATUS\G" 2>/dev/null | grep -E "Slave_IO_Running:|Slave_SQL_Running:|Last_Error"
