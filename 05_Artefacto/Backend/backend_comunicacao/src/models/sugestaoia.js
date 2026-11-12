const pool = require('../config/database');

const exec = (db) => db || pool;

async function criar({ idProjeto, idUtilizador, tipo, descricao, justificacao = null }, db) {
    const [r] = await exec(db).query(
        `INSERT INTO sugestoes_ia (id_projeto, id_utilizador, tipo_sugestao, descricao, justificacao)
         VALUES (?, ?, ?, ?, ?)`,
        [idProjeto, idUtilizador, tipo, descricao, justificacao]
    );
    return r.insertId;
}

async function obterPorId(idSugestao, db) {
    const [rows] = await exec(db).query(
        `SELECT id_sugestao, id_projeto, id_utilizador, tipo_sugestao, descricao, justificacao, estado, data_geracao
           FROM sugestoes_ia WHERE id_sugestao = ?`,
        [idSugestao]
    );
    return rows[0] || null;
}

async function listarPorProjeto(idProjeto, { estado } = {}, db) {
    const params = [idProjeto];
    let filtro = '';
    if (estado) { filtro = 'AND estado = ?'; params.push(estado); }
    const [rows] = await exec(db).query(
        `SELECT id_sugestao, id_projeto, id_utilizador, tipo_sugestao, descricao, justificacao, estado, data_geracao
           FROM sugestoes_ia WHERE id_projeto = ? ${filtro}
          ORDER BY data_geracao DESC, id_sugestao DESC LIMIT 200`,
        params
    );
    return rows;
}

async function atualizarEstado(idSugestao, estado, db) {
    const [r] = await exec(db).query('UPDATE sugestoes_ia SET estado = ? WHERE id_sugestao = ?', [estado, idSugestao]);
    return r.affectedRows;
}

module.exports = { criar, obterPorId, listarPorProjeto, atualizarEstado };