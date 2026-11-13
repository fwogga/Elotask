const pool = require('../config/database');

const exec = (db) => db || pool;

async function criar({ idEquipa, nome, descricao, tipo, idCriador }, db) {
    const [r] = await exec(db).query(
        'INSERT INTO canais (id_equipa, nome, descricao, tipo, id_criador) VALUES (?, ?, ?, ?, ?)',
        [idEquipa, nome, descricao, tipo, idCriador]
    );
    return r.insertId;
}

async function obterPorId(idCanal, db) {
    const [rows] = await exec(db).query(
        `SELECT id_canal, id_equipa, nome, descricao, tipo, id_criador, data_criacao FROM canais WHERE id_canal = ?`,
        [idCanal]
    );
    return rows[0] || null;
}

/** Canais de uma equipa visíveis ao utilizador: públicos + privados em que é membro. */
async function listarPorEquipa(idEquipa, idUtilizador, db) {
    const [rows] = await exec(db).query(
        `SELECT c.id_canal, c.id_equipa, c.nome, c.descricao, c.tipo, c.id_criador, c.data_criacao,
                mc.papel AS papel_utilizador,
                (mc.id_utilizador IS NOT NULL) AS e_membro
           FROM canais c
           LEFT JOIN membros_canal mc ON mc.id_canal = c.id_canal AND mc.id_utilizador = ?
          WHERE c.id_equipa = ? AND (c.tipo = 'publico' OR mc.id_utilizador IS NOT NULL)
          ORDER BY c.nome`,
        [idUtilizador, idEquipa]
    );
    return rows.map((r) => ({ ...r, e_membro: !!r.e_membro }));
}

/** Canais em que o utilizador é membro. */
async function listarDoUtilizador(idUtilizador, db) {
    const [rows] = await exec(db).query(
        `SELECT c.id_canal, c.id_equipa, e.nome AS nome_equipa, c.nome, c.descricao, c.tipo, mc.papel AS papel_utilizador,
                (SELECT MAX(m.data_envio) FROM mensagens m
                  WHERE m.id_canal = c.id_canal AND m.data_eliminacao IS NULL) AS data_ultima_mensagem
           FROM membros_canal mc
           JOIN canais c ON c.id_canal = mc.id_canal
           JOIN equipas e ON e.id_equipa = c.id_equipa
          WHERE mc.id_utilizador = ?
          ORDER BY e.nome, c.nome`,
        [idUtilizador]
    );
    return rows;
}

async function atualizar(idCanal, { nome, descricao, tipo }, db) {
    const campos = [];
    const valores = [];
    if (nome !== undefined) { campos.push('nome = ?'); valores.push(nome); }
    if (descricao !== undefined) { campos.push('descricao = ?'); valores.push(descricao); }
    if (tipo !== undefined) { campos.push('tipo = ?'); valores.push(tipo); }
    if (!campos.length) return 0;
    valores.push(idCanal);
    const [r] = await exec(db).query(`UPDATE canais SET ${campos.join(', ')} WHERE id_canal = ?`, valores);
    return r.affectedRows;
}

async function eliminar(idCanal, db) {
    const [r] = await exec(db).query('DELETE FROM canais WHERE id_canal = ?', [idCanal]);
    return r.affectedRows;
}

/** O utilizador pertence à equipa? (tabela membros_equipa) */
async function ehMembroEquipa(idEquipa, idUtilizador, db) {
    const [rows] = await exec(db).query(
        'SELECT 1 FROM membros_equipa WHERE id_equipa = ? AND id_utilizador = ?',
        [idEquipa, idUtilizador]
    );
    return rows.length > 0;
}

/** Subconjunto de `ids` que pertence à equipa. */
async function filtrarMembrosEquipa(idEquipa, ids, db) {
    if (!ids.length) return [];
    const [rows] = await exec(db).query(
        'SELECT id_utilizador FROM membros_equipa WHERE id_equipa = ? AND id_utilizador IN (?)',
        [idEquipa, ids]
    );
    return rows.map((r) => r.id_utilizador);
}

async function equipaExiste(idEquipa, db) {
    const [rows] = await exec(db).query('SELECT 1 FROM equipas WHERE id_equipa = ?', [idEquipa]);
    return rows.length > 0;
}

module.exports = {
    criar, obterPorId, listarPorEquipa, listarDoUtilizador, atualizar, eliminar,
    ehMembroEquipa, filtrarMembrosEquipa, equipaExiste
};