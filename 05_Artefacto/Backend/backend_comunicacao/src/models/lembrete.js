const pool = require('../config/database');

const exec = (db) => db || pool;

/** Lembretes pendentes cuja hora já passou (com título da tarefa). */
async function listarPendentesVencidos(limite = 100, db) {
    const [rows] = await exec(db).query(
        `SELECT l.id_lembrete, l.id_tarefa, l.id_utilizador, l.tipo_lembrete, l.data_lembrete, l.mensagem,
                t.titulo AS titulo_tarefa
           FROM lembretes_prazos l JOIN tarefas t ON t.id_tarefa = l.id_tarefa
          WHERE l.estado = 'pendente' AND l.data_lembrete <= NOW()
          ORDER BY l.data_lembrete LIMIT ?`,
        [limite]
    );
    return rows;
}

/** Marca como enviado apenas se ainda estiver pendente (evita envios duplicados). */
async function marcarEnviado(idLembrete, db) {
    const [r] = await exec(db).query(
        `UPDATE lembretes_prazos SET estado = 'enviado', data_envio = NOW()
          WHERE id_lembrete = ? AND estado = 'pendente'`,
        [idLembrete]
    );
    return r.affectedRows;
}

async function marcarFalhado(idLembrete, db) {
    await exec(db).query(
        `UPDATE lembretes_prazos SET estado = 'falhado' WHERE id_lembrete = ? AND estado = 'pendente'`,
        [idLembrete]
    );
}

async function listarPorUtilizador(idUtilizador, db) {
    const [rows] = await exec(db).query(
        `SELECT l.id_lembrete, l.id_tarefa, t.titulo AS titulo_tarefa, l.tipo_lembrete, l.data_lembrete,
                l.mensagem, l.estado, l.data_envio
           FROM lembretes_prazos l JOIN tarefas t ON t.id_tarefa = l.id_tarefa
          WHERE l.id_utilizador = ? ORDER BY l.data_lembrete DESC`,
        [idUtilizador]
    );
    return rows;
}

module.exports = { listarPendentesVencidos, marcarEnviado, marcarFalhado, listarPorUtilizador };