const pool = require('../config/database');

const exec = (db) => db || pool;

const CAMPOS = `d.id_decisao, d.id_reuniao, d.descricao, d.id_responsavel, u.nome AS nome_responsavel,
                d.data_decisao, d.estado_validacao, d.data_criacao`;

async function criar({ idReuniao, descricao, idResponsavel = null }, db) {
    const [r] = await exec(db).query(
        'INSERT INTO decisoes_reuniao (id_reuniao, descricao, id_responsavel) VALUES (?, ?, ?)',
        [idReuniao, descricao, idResponsavel]
    );
    return r.insertId;
}

async function obterPorId(idDecisao, db) {
    const [rows] = await exec(db).query(
        `SELECT ${CAMPOS}
           FROM decisoes_reuniao d LEFT JOIN utilizadores u ON u.id_utilizador = d.id_responsavel
          WHERE d.id_decisao = ?`,
        [idDecisao]
    );
    return rows[0] || null;
}

async function listarPorReuniao(idReuniao, db) {
    const [rows] = await exec(db).query(
        `SELECT ${CAMPOS}
           FROM decisoes_reuniao d LEFT JOIN utilizadores u ON u.id_utilizador = d.id_responsavel
          WHERE d.id_reuniao = ? ORDER BY d.id_decisao`,
        [idReuniao]
    );
    return rows;
}

/** Só decisões confirmadas ou pendentes (as rejeitadas não entram no contexto da IA). */
async function listarDescricoesPorReunioes(idsReunioes, db) {
    if (!idsReunioes.length) return [];
    const [rows] = await exec(db).query(
        `SELECT id_reuniao, descricao FROM decisoes_reuniao
          WHERE id_reuniao IN (?) AND estado_validacao <> 'rejeitada' ORDER BY id_decisao`,
        [idsReunioes]
    );
    return rows;
}

async function atualizarValidacao(idDecisao, estado, db) {
    const [r] = await exec(db).query(
        'UPDATE decisoes_reuniao SET estado_validacao = ? WHERE id_decisao = ?',
        [estado, idDecisao]
    );
    return r.affectedRows;
}

module.exports = { criar, obterPorId, listarPorReuniao, listarDescricoesPorReunioes, atualizarValidacao };