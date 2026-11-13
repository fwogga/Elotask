const pool = require('../config/database');

const exec = (db) => db || pool;

async function obter(idCanal, idUtilizador, db) {
    const [rows] = await exec(db).query(
        'SELECT id_canal, id_utilizador, papel, data_entrada FROM membros_canal WHERE id_canal = ? AND id_utilizador = ?',
        [idCanal, idUtilizador]
    );
    return rows[0] || null;
}

async function adicionar(idCanal, idUtilizador, papel = 'membro', db) {
    const [r] = await exec(db).query(
        'INSERT IGNORE INTO membros_canal (id_canal, id_utilizador, papel) VALUES (?, ?, ?)',
        [idCanal, idUtilizador, papel]
    );
    return r.affectedRows; // 0 se já era membro
}

/** membros_canal não tem data_saida: a remoção apaga a associação. */
async function remover(idCanal, idUtilizador, db) {
    const [r] = await exec(db).query('DELETE FROM membros_canal WHERE id_canal = ? AND id_utilizador = ?', [idCanal, idUtilizador]);
    return r.affectedRows;
}

async function atualizarPapel(idCanal, idUtilizador, papel, db) {
    const [r] = await exec(db).query(
        'UPDATE membros_canal SET papel = ? WHERE id_canal = ? AND id_utilizador = ?',
        [papel, idCanal, idUtilizador]
    );
    return r.affectedRows;
}

async function listar(idCanal, db) {
    const [rows] = await exec(db).query(
        `SELECT mc.id_utilizador, u.nome, u.email, u.cargo, u.foto_perfil, mc.papel, mc.data_entrada
           FROM membros_canal mc JOIN utilizadores u ON u.id_utilizador = mc.id_utilizador
          WHERE mc.id_canal = ? ORDER BY mc.data_entrada, u.nome`,
        [idCanal]
    );
    return rows;
}

async function listarIds(idCanal, db) {
    const [rows] = await exec(db).query('SELECT id_utilizador FROM membros_canal WHERE id_canal = ?', [idCanal]);
    return rows.map((r) => r.id_utilizador);
}

async function contarAdministradores(idCanal, db) {
    const [rows] = await exec(db).query(
        `SELECT COUNT(*) AS total FROM membros_canal WHERE id_canal = ? AND papel = 'administrador'`,
        [idCanal]
    );
    return rows[0].total;
}

async function listarIdsCanaisDoUtilizador(idUtilizador, db) {
    const [rows] = await exec(db).query('SELECT id_canal FROM membros_canal WHERE id_utilizador = ?', [idUtilizador]);
    return rows.map((r) => r.id_canal);
}

module.exports = {
    obter, adicionar, remover, atualizarPapel, listar, listarIds, contarAdministradores, listarIdsCanaisDoUtilizador
};