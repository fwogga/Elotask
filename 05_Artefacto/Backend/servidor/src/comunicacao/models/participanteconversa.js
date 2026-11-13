const pool = require('../config/database');

const exec = (db) => db || pool;

/** Participante ativo (data_saida IS NULL) ou null. */
async function obterAtivo(idConversa, idUtilizador, db) {
    const [rows] = await exec(db).query(
        `SELECT id_conversa, id_utilizador, papel, data_entrada
           FROM membros_conversa
          WHERE id_conversa = ? AND id_utilizador = ? AND data_saida IS NULL`,
        [idConversa, idUtilizador]
    );
    return rows[0] || null;
}

/** Adiciona (ou readmite, se já tinha saído) um participante. */
async function adicionar(idConversa, idUtilizador, papel = 'membro', db) {
    await exec(db).query(
        `INSERT INTO membros_conversa (id_conversa, id_utilizador, papel)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE data_saida = NULL, data_entrada = NOW(), papel = VALUES(papel)`,
        [idConversa, idUtilizador, papel]
    );
}

async function remover(idConversa, idUtilizador, db) {
    const [r] = await exec(db).query(
        `UPDATE membros_conversa SET data_saida = NOW()
          WHERE id_conversa = ? AND id_utilizador = ? AND data_saida IS NULL`,
        [idConversa, idUtilizador]
    );
    return r.affectedRows;
}

async function atualizarPapel(idConversa, idUtilizador, papel, db) {
    const [r] = await exec(db).query(
        `UPDATE membros_conversa SET papel = ?
          WHERE id_conversa = ? AND id_utilizador = ? AND data_saida IS NULL`,
        [papel, idConversa, idUtilizador]
    );
    return r.affectedRows;
}

async function listarIdsAtivos(idConversa, db) {
    const [rows] = await exec(db).query(
        'SELECT id_utilizador FROM membros_conversa WHERE id_conversa = ? AND data_saida IS NULL',
        [idConversa]
    );
    return rows.map((r) => r.id_utilizador);
}

async function contarAdministradores(idConversa, db) {
    const [rows] = await exec(db).query(
        `SELECT COUNT(*) AS total FROM membros_conversa
          WHERE id_conversa = ? AND data_saida IS NULL AND papel = 'administrador'`,
        [idConversa]
    );
    return rows[0].total;
}

/** Ids das conversas ativas de um utilizador (usado para entrar nas salas Socket.IO). */
async function listarIdsConversasDoUtilizador(idUtilizador, db) {
    const [rows] = await exec(db).query(
        `SELECT mc.id_conversa
           FROM membros_conversa mc JOIN conversas c ON c.id_conversa = mc.id_conversa
          WHERE mc.id_utilizador = ? AND mc.data_saida IS NULL AND c.estado = 'ativa'`,
        [idUtilizador]
    );
    return rows.map((r) => r.id_conversa);
}

module.exports = {
    obterAtivo, adicionar, remover, atualizarPapel, listarIdsAtivos, contarAdministradores, listarIdsConversasDoUtilizador
};