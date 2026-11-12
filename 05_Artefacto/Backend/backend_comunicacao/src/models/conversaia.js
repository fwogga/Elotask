const pool = require('../config/database');

const exec = (db) => db || pool;

async function criar({ idUtilizador, idProjeto = null }, db) {
    const [r] = await exec(db).query(
        'INSERT INTO conversas_ia (id_utilizador, id_projeto) VALUES (?, ?)',
        [idUtilizador, idProjeto]
    );
    return r.insertId;
}

async function obterPorId(idConversaIa, db) {
    const [rows] = await exec(db).query(
        'SELECT id_conversa_ia, id_utilizador, id_projeto, data_criacao FROM conversas_ia WHERE id_conversa_ia = ?',
        [idConversaIa]
    );
    return rows[0] || null;
}

/** Conversas com a IA do próprio utilizador (mais recentes primeiro), com a data da última mensagem. */
async function listarDoUtilizador(idUtilizador, limite = 50, db) {
    const [rows] = await exec(db).query(
        `SELECT c.id_conversa_ia, c.id_projeto, p.nome AS nome_projeto, c.data_criacao,
                (SELECT MAX(m.data_criacao) FROM mensagens_ia m WHERE m.id_conversa_ia = c.id_conversa_ia) AS data_ultima_mensagem
           FROM conversas_ia c
           LEFT JOIN projetos p ON p.id_projeto = c.id_projeto
          WHERE c.id_utilizador = ?
          ORDER BY COALESCE(
                    (SELECT MAX(m.data_criacao) FROM mensagens_ia m WHERE m.id_conversa_ia = c.id_conversa_ia),
                    c.data_criacao) DESC, c.id_conversa_ia DESC
          LIMIT ?`,
        [idUtilizador, limite]
    );
    return rows;
}

module.exports = { criar, obterPorId, listarDoUtilizador };