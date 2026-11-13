const pool = require('../config/database');

const exec = (db) => db || pool;

async function obter(idReuniao, idUtilizador, db) {
    const [rows] = await exec(db).query(
        `SELECT id_reuniao, id_utilizador, estado_convite, data_resposta
           FROM reuniao_participantes WHERE id_reuniao = ? AND id_utilizador = ?`,
        [idReuniao, idUtilizador]
    );
    return rows[0] || null;
}

/** Adiciona um participante; devolve 0 se já existia. data_resposta só é preenchida se o convite não for 'pendente'. */
async function adicionar(idReuniao, idUtilizador, estadoConvite = 'pendente', db) {
    const [r] = await exec(db).query(
        `INSERT IGNORE INTO reuniao_participantes (id_reuniao, id_utilizador, estado_convite, data_resposta)
         VALUES (?, ?, ?, IF(? = 'pendente', NULL, NOW()))`,
        [idReuniao, idUtilizador, estadoConvite, estadoConvite]
    );
    return r.affectedRows;
}

async function listar(idReuniao, db) {
    const [rows] = await exec(db).query(
        `SELECT rp.id_utilizador, u.nome, u.email, u.cargo, u.foto_perfil, rp.estado_convite, rp.data_resposta
           FROM reuniao_participantes rp JOIN utilizadores u ON u.id_utilizador = rp.id_utilizador
          WHERE rp.id_reuniao = ?
          ORDER BY u.nome`,
        [idReuniao]
    );
    return rows;
}

async function listarIds(idReuniao, db) {
    const [rows] = await exec(db).query('SELECT id_utilizador FROM reuniao_participantes WHERE id_reuniao = ?', [idReuniao]);
    return rows.map((r) => r.id_utilizador);
}

async function contar(idReuniao, db) {
    const [rows] = await exec(db).query('SELECT COUNT(*) AS total FROM reuniao_participantes WHERE id_reuniao = ?', [idReuniao]);
    return rows[0].total;
}

async function responder(idReuniao, idUtilizador, estadoConvite, db) {
    const [r] = await exec(db).query(
        `UPDATE reuniao_participantes SET estado_convite = ?, data_resposta = NOW()
          WHERE id_reuniao = ? AND id_utilizador = ?`,
        [estadoConvite, idReuniao, idUtilizador]
    );
    return r.affectedRows;
}

async function remover(idReuniao, idUtilizador, db) {
    const [r] = await exec(db).query(
        'DELETE FROM reuniao_participantes WHERE id_reuniao = ? AND id_utilizador = ?',
        [idReuniao, idUtilizador]
    );
    return r.affectedRows;
}

module.exports = { obter, adicionar, listar, listarIds, contar, responder, remover };