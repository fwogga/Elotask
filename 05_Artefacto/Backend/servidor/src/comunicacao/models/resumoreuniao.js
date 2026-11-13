const pool = require('../config/database');

const exec = (db) => db || pool;

async function criar({ idReuniao, conteudo, modelo }, db) {
    const [r] = await exec(db).query(
        'INSERT INTO resumos_reunioes (id_reuniao, conteudo_resumo, modelo_ia) VALUES (?, ?, ?)',
        [idReuniao, conteudo, modelo]
    );
    return r.insertId;
}

async function obterPorId(idResumo, db) {
    const [rows] = await exec(db).query(
        'SELECT id_resumo, id_reuniao, conteudo_resumo, modelo_ia, data_geracao FROM resumos_reunioes WHERE id_resumo = ?',
        [idResumo]
    );
    return rows[0] || null;
}

/** Resumos de uma reunião, do mais recente para o mais antigo. */
async function listarPorReuniao(idReuniao, db) {
    const [rows] = await exec(db).query(
        `SELECT id_resumo, id_reuniao, conteudo_resumo, modelo_ia, data_geracao
           FROM resumos_reunioes WHERE id_reuniao = ? ORDER BY data_geracao DESC, id_resumo DESC`,
        [idReuniao]
    );
    return rows;
}

/**
 * Reuniões recentes em que o utilizador participa e que já têm resumo (último resumo de cada uma).
 * Serve de contexto ao chat; só devolve reuniões a que o utilizador tem acesso.
 */
async function listarRecentesDoUtilizador(idUtilizador, limite = 5, db) {
    const [rows] = await exec(db).query(
        `SELECT r.id_reuniao, r.titulo, rr.conteudo_resumo AS resumo
           FROM reuniao_participantes rp
           JOIN reunioes r ON r.id_reuniao = rp.id_reuniao
           JOIN resumos_reunioes rr ON rr.id_resumo = (
                SELECT x.id_resumo FROM resumos_reunioes x
                 WHERE x.id_reuniao = r.id_reuniao ORDER BY x.data_geracao DESC, x.id_resumo DESC LIMIT 1)
          WHERE rp.id_utilizador = ? AND rp.estado_convite <> 'recusado'
          ORDER BY r.data_inicio DESC
          LIMIT ?`,
        [idUtilizador, limite]
    );
    return rows;
}

module.exports = { criar, obterPorId, listarPorReuniao, listarRecentesDoUtilizador };