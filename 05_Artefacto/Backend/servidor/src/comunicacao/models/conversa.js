const pool = require('../config/database');

const exec = (db) => db || pool;

/** Conversas ativas em que o utilizador participa (com nome do interlocutor e data da última mensagem). */
async function listarConversasPorUtilizador(idUtilizador, db) {
    const [rows] = await exec(db).query(
        `SELECT * FROM (
         SELECT c.id_conversa, c.nome, c.tipo, c.id_criador, c.data_criacao, c.estado, mc.papel,
                (SELECT u2.nome
                   FROM membros_conversa m2
                   JOIN utilizadores u2 ON u2.id_utilizador = m2.id_utilizador
                  WHERE m2.id_conversa = c.id_conversa AND m2.id_utilizador <> ? AND m2.data_saida IS NULL
                  ORDER BY m2.data_entrada LIMIT 1) AS nome_outro_participante,
                (SELECT MAX(m.data_envio) FROM mensagens m
                  WHERE m.id_conversa = c.id_conversa AND m.data_eliminacao IS NULL) AS data_ultima_mensagem
           FROM conversas c
           JOIN membros_conversa mc ON mc.id_conversa = c.id_conversa
          WHERE mc.id_utilizador = ? AND mc.data_saida IS NULL AND c.estado = 'ativa'
         ) t
          ORDER BY COALESCE(t.data_ultima_mensagem, t.data_criacao) DESC`,
        [idUtilizador, idUtilizador]
    );
    return rows;
}

async function obterConversaPorId(idConversa, db) {
    const [rows] = await exec(db).query(
        `SELECT id_conversa, nome, tipo, id_criador, data_criacao, estado
           FROM conversas WHERE id_conversa = ?`,
        [idConversa]
    );
    return rows[0] || null;
}

/** Participantes ativos (data_saida IS NULL). */
async function listarMembrosDaConversa(idConversa, db) {
    const [rows] = await exec(db).query(
        `SELECT mc.id_utilizador, u.nome, u.email, u.cargo, u.foto_perfil, mc.papel, mc.data_entrada
           FROM membros_conversa mc
           JOIN utilizadores u ON u.id_utilizador = mc.id_utilizador
          WHERE mc.id_conversa = ? AND mc.data_saida IS NULL
          ORDER BY mc.data_entrada, u.nome`,
        [idConversa]
    );
    return rows;
}

/** Procura uma conversa individual ativa entre dois utilizadores. */
async function encontrarIndividualEntre(idA, idB, db) {
    const [rows] = await exec(db).query(
        `SELECT c.id_conversa
           FROM conversas c
           JOIN membros_conversa m1 ON m1.id_conversa = c.id_conversa AND m1.id_utilizador = ? AND m1.data_saida IS NULL
           JOIN membros_conversa m2 ON m2.id_conversa = c.id_conversa AND m2.id_utilizador = ? AND m2.data_saida IS NULL
          WHERE c.tipo = 'individual' AND c.estado <> 'inativa'
          ORDER BY c.id_conversa LIMIT 1`,
        [idA, idB]
    );
    return rows[0] ? rows[0].id_conversa : null;
}

async function criar({ nome, tipo, idCriador }, db) {
    const [r] = await exec(db).query(
        'INSERT INTO conversas (nome, tipo, id_criador) VALUES (?, ?, ?)',
        [nome, tipo, idCriador]
    );
    return r.insertId;
}

async function atualizar(idConversa, { nome, estado }, db) {
    const campos = [];
    const valores = [];
    if (nome !== undefined) { campos.push('nome = ?'); valores.push(nome); }
    if (estado !== undefined) { campos.push('estado = ?'); valores.push(estado); }
    if (!campos.length) return 0;
    valores.push(idConversa);
    const [r] = await exec(db).query(`UPDATE conversas SET ${campos.join(', ')} WHERE id_conversa = ?`, valores);
    return r.affectedRows;
}

module.exports = {
    listarConversasPorUtilizador,
    obterConversaPorId,
    listarMembrosDaConversa,
    encontrarIndividualEntre,
    criar,
    atualizar
};