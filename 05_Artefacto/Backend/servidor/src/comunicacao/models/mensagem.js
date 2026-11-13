const pool = require('../config/database');
const anexoModel = require('./anexo');

const exec = (db) => db || pool;

const SELECT_BASE = `
    SELECT m.id_mensagem, m.id_conversa, m.id_canal, m.id_remetente, u.nome AS nome_remetente,
           u.foto_perfil AS foto_remetente, m.conteudo, m.tipo_mensagem, m.id_mensagem_resposta,
           CASE WHEN r.data_eliminacao IS NULL THEN r.conteudo END AS conteudo_resposta,
           r.id_remetente AS id_remetente_resposta,
           m.data_envio, m.data_edicao
      FROM mensagens m
      JOIN utilizadores u ON u.id_utilizador = m.id_remetente
      LEFT JOIN mensagens r ON r.id_mensagem = m.id_mensagem_resposta`;

async function juntarAnexos(mensagens, db) {
    const anexos = await anexoModel.listarPorMensagens(mensagens.map((m) => m.id_mensagem), db);
    const porMensagem = new Map();
    for (const a of anexos) {
        if (!porMensagem.has(a.id_mensagem)) porMensagem.set(a.id_mensagem, []);
        porMensagem.get(a.id_mensagem).push(a);
    }
    return mensagens.map((m) => ({ ...m, anexos: porMensagem.get(m.id_mensagem) || [] }));
}

async function criar({ idConversa, idCanal, idRemetente, conteudo, tipoMensagem, idMensagemResposta }, db) {
    const [r] = await exec(db).query(
        `INSERT INTO mensagens (id_conversa, id_canal, id_remetente, conteudo, tipo_mensagem, id_mensagem_resposta)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [idConversa || null, idCanal || null, idRemetente, conteudo, tipoMensagem, idMensagemResposta || null]
    );
    return r.insertId;
}

/** Dados mínimos de uma mensagem (inclui eliminadas) — para validações. */
async function obterBasico(idMensagem, db) {
    const [rows] = await exec(db).query(
        `SELECT id_mensagem, id_conversa, id_canal, id_remetente, conteudo, tipo_mensagem, data_eliminacao
           FROM mensagens WHERE id_mensagem = ?`,
        [idMensagem]
    );
    return rows[0] || null;
}

/** Mensagem completa (com remetente, resposta e anexos). Não devolve mensagens eliminadas. */
async function obterPorId(idMensagem, db) {
    const [rows] = await exec(db).query(
        `${SELECT_BASE} WHERE m.id_mensagem = ? AND m.data_eliminacao IS NULL`,
        [idMensagem]
    );
    if (!rows.length) return null;
    return (await juntarAnexos(rows, db))[0];
}

/**
 * Histórico paginado por cursor: devolve as `limite` mensagens mais recentes anteriores a `antes`
 * (ordem cronológica) e o cursor para a página seguinte (mais antigas).
 */
async function listarHistorico(coluna, idContentor, { limite, antes }, db) {
    if (!['id_conversa', 'id_canal'].includes(coluna)) throw new Error('Coluna inválida.');
    const params = [idContentor];
    let filtroAntes = '';
    if (antes) { filtroAntes = 'AND m.id_mensagem < ?'; params.push(antes); }
    params.push(limite + 1);

    const [rows] = await exec(db).query(
        `${SELECT_BASE}
          WHERE m.${coluna} = ? AND m.data_eliminacao IS NULL ${filtroAntes}
          ORDER BY m.id_mensagem DESC LIMIT ?`,
        params
    );
    const temMais = rows.length > limite;
    const pagina = rows.slice(0, limite).reverse();
    return {
        mensagens: await juntarAnexos(pagina, db),
        proximo_cursor: temMais ? pagina[0].id_mensagem : null
    };
}

const listarPorConversa = (id, pag, db) => listarHistorico('id_conversa', id, pag, db);
const listarPorCanal = (id, pag, db) => listarHistorico('id_canal', id, pag, db);

async function editar(idMensagem, conteudo, db) {
    const [r] = await exec(db).query(
        'UPDATE mensagens SET conteudo = ?, data_edicao = NOW() WHERE id_mensagem = ? AND data_eliminacao IS NULL',
        [conteudo, idMensagem]
    );
    return r.affectedRows;
}

/** Atualiza o tipo da mensagem (texto, imagem, ficheiro...) quando se juntam ou removem anexos. */
async function atualizarTipo(idMensagem, tipoMensagem, db) {
    const [r] = await exec(db).query(
        'UPDATE mensagens SET tipo_mensagem = ? WHERE id_mensagem = ? AND data_eliminacao IS NULL',
        [tipoMensagem, idMensagem]
    );
    return r.affectedRows;
}

/** Eliminação lógica: mantém o registo (e as respostas), remove o conteúdo. */
async function eliminar(idMensagem, db) {
    const [r] = await exec(db).query(
        'UPDATE mensagens SET data_eliminacao = NOW(), conteudo = NULL WHERE id_mensagem = ? AND data_eliminacao IS NULL',
        [idMensagem]
    );
    return r.affectedRows;
}

module.exports = {
    criar, obterBasico, obterPorId, listarPorConversa, listarPorCanal, editar, atualizarTipo, eliminar, juntarAnexos
};