const pool = require('../config/database');

const exec = (db) => db || pool;

const CAMPOS = `s.id_sugestao, s.id_tarefa, t.titulo AS titulo_tarefa, t.id_projeto,
                s.prioridade_atual, s.prioridade_sugerida, s.prazo_atual, s.prazo_sugerido,
                s.justificacao, s.estado, s.data_geracao`;

async function criar({ idTarefa, prioridadeAtual, prioridadeSugerida, prazoAtual, prazoSugerido, justificacao = null }, db) {
    const [r] = await exec(db).query(
        `INSERT INTO sugestoes_organizacao
            (id_tarefa, prioridade_atual, prioridade_sugerida, prazo_atual, prazo_sugerido, justificacao)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [idTarefa, prioridadeAtual, prioridadeSugerida, prazoAtual, prazoSugerido, justificacao]
    );
    return r.insertId;
}

/** Inclui o projeto da tarefa, para verificar se quem pede pertence a esse projeto. */
async function obterPorId(idSugestao, db) {
    const [rows] = await exec(db).query(
        `SELECT ${CAMPOS} FROM sugestoes_organizacao s JOIN tarefas t ON t.id_tarefa = s.id_tarefa WHERE s.id_sugestao = ?`,
        [idSugestao]
    );
    return rows[0] || null;
}

async function listarPorProjeto(idProjeto, { estado } = {}, db) {
    const params = [idProjeto];
    let filtro = '';
    if (estado) { filtro = 'AND s.estado = ?'; params.push(estado); }
    const [rows] = await exec(db).query(
        `SELECT ${CAMPOS}
           FROM sugestoes_organizacao s JOIN tarefas t ON t.id_tarefa = s.id_tarefa
          WHERE t.id_projeto = ? ${filtro}
          ORDER BY s.data_geracao DESC, s.id_sugestao DESC LIMIT 200`,
        params
    );
    return rows;
}

async function atualizarEstado(idSugestao, estado, db) {
    const [r] = await exec(db).query('UPDATE sugestoes_organizacao SET estado = ? WHERE id_sugestao = ?', [estado, idSugestao]);
    return r.affectedRows;
}

module.exports = { criar, obterPorId, listarPorProjeto, atualizarEstado };