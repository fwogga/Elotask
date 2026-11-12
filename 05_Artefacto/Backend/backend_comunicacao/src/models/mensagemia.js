const pool = require('../config/database');

const exec = (db) => db || pool;

async function criar({ idConversaIa, tipo, conteudo }, db) {
    const [r] = await exec(db).query(
        'INSERT INTO mensagens_ia (id_conversa_ia, tipo_mensagem, conteudo) VALUES (?, ?, ?)',
        [idConversaIa, tipo, conteudo]
    );
    return r.insertId;
}

/** As últimas `n` mensagens, em ordem cronológica (para dar memória ao chat). */
async function ultimas(idConversaIa, n = 10, db) {
    const [rows] = await exec(db).query(
        `SELECT tipo_mensagem AS tipo, conteudo FROM mensagens_ia
         WHERE id_conversa_ia = ? ORDER BY id_mensagem_ia DESC LIMIT ?`,
        [idConversaIa, n]
    );
    return rows.reverse();
}

/** Histórico paginado por cursor (mesmo formato das mensagens normais). */
async function listarPorConversa(idConversaIa, { limite, antes }, db) {
    const params = [idConversaIa];
    let filtroAntes = '';
    if (antes) { filtroAntes = 'AND id_mensagem_ia < ?'; params.push(antes); }
    params.push(limite + 1);

    const [rows] = await exec(db).query(
        `SELECT id_mensagem_ia, id_conversa_ia, tipo_mensagem, conteudo, data_criacao
         FROM mensagens_ia
         WHERE id_conversa_ia = ? ${filtroAntes}
         ORDER BY id_mensagem_ia DESC LIMIT ?`,
        params
    );
    const temMais = rows.length > limite;
    const pagina = rows.slice(0, limite).reverse();
    return { mensagens: pagina, proximo_cursor: temMais ? pagina[0].id_mensagem_ia : null };
}

module.exports = { criar, ultimas, listarPorConversa };