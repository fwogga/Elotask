const pool = require('../config/database');

const exec = (db) => db || pool;

async function obterPorId(id, db) {
    const [rows] = await exec(db).query(
        `SELECT id_utilizador, nome, email, cargo, foto_perfil, tipo_utilizador, estado
           FROM utilizadores WHERE id_utilizador = ?`,
        [id]
    );
    return rows[0] || null;
}

/** Devolve apenas os utilizadores ativos cujo id está na lista. */
async function listarAtivosPorIds(ids, db) {
    if (!ids.length) return [];
    const [rows] = await exec(db).query(
        `SELECT id_utilizador, nome FROM utilizadores WHERE estado = 'ativo' AND id_utilizador IN (?)`,
        [ids]
    );
    return rows;
}

async function pesquisar(termo, limite = 20, db) {
    const like = `%${termo.replace(/[%_\\]/g, '\\$&')}%`;
    const [rows] = await exec(db).query(
        `SELECT id_utilizador, nome, email, cargo, foto_perfil
           FROM utilizadores
          WHERE estado = 'ativo' AND (nome LIKE ? OR email LIKE ?)
          ORDER BY nome LIMIT ?`,
        [like, like, limite]
    );
    return rows;
}

module.exports = { obterPorId, listarAtivosPorIds, pesquisar };