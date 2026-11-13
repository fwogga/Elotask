const pool = require('../config/database');

const exec = (db) => db || pool;

async function criar({ idUtilizador, tipo, titulo, mensagem, entidadeTipo = null, entidadeId = null }, db) {
    const [r] = await exec(db).query(
        `INSERT INTO notificacoes (id_utilizador, tipo, titulo, mensagem, entidade_tipo, entidade_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [idUtilizador, tipo, titulo, mensagem, entidadeTipo, entidadeId]
    );
    return r.insertId;
}

async function obterPorId(idNotificacao, db) {
    const [rows] = await exec(db).query('SELECT * FROM notificacoes WHERE id_notificacao = ?', [idNotificacao]);
    return rows[0] ? normalizar(rows[0]) : null;
}

function normalizar(n) {
    return { ...n, lida: !!n.lida };
}

async function listarPorUtilizador(idUtilizador, { limite, antes, apenasNaoLidas }, db) {
    const params = [idUtilizador];
    let filtros = '';
    if (apenasNaoLidas) filtros += ' AND lida = 0';
    if (antes) { filtros += ' AND id_notificacao < ?'; params.push(antes); }
    params.push(limite + 1);

    const [rows] = await exec(db).query(
        `SELECT * FROM notificacoes WHERE id_utilizador = ?${filtros} ORDER BY id_notificacao DESC LIMIT ?`,
        params
    );
    const temMais = rows.length > limite;
    const pagina = rows.slice(0, limite).map(normalizar);
    return { notificacoes: pagina, proximo_cursor: temMais ? pagina[pagina.length - 1].id_notificacao : null };
}

async function contarNaoLidas(idUtilizador, db) {
    const [rows] = await exec(db).query(
        'SELECT COUNT(*) AS total FROM notificacoes WHERE id_utilizador = ? AND lida = 0',
        [idUtilizador]
    );
    return rows[0].total;
}

async function marcarComoLida(idNotificacao, idUtilizador, db) {
    const [r] = await exec(db).query(
        `UPDATE notificacoes SET lida = 1, data_leitura = COALESCE(data_leitura, NOW())
          WHERE id_notificacao = ? AND id_utilizador = ?`,
        [idNotificacao, idUtilizador]
    );
    return r.affectedRows;
}

async function marcarTodasComoLidas(idUtilizador, db) {
    const [r] = await exec(db).query(
        'UPDATE notificacoes SET lida = 1, data_leitura = NOW() WHERE id_utilizador = ? AND lida = 0',
        [idUtilizador]
    );
    return r.affectedRows;
}

async function eliminar(idNotificacao, idUtilizador, db) {
    const [r] = await exec(db).query(
        'DELETE FROM notificacoes WHERE id_notificacao = ? AND id_utilizador = ?',
        [idNotificacao, idUtilizador]
    );
    return r.affectedRows;
}

/**
 * Dos `ids` indicados, devolve os que já têm uma notificação NÃO lida deste tipo para esta entidade.
 * Serve para não encher o utilizador de avisos quando chegam várias mensagens seguidas.
 */
async function utilizadoresComNaoLidaDaEntidade(ids, tipo, entidadeTipo, entidadeId, db) {
    if (!ids.length) return [];
    const [rows] = await exec(db).query(
        `SELECT DISTINCT id_utilizador FROM notificacoes
          WHERE lida = 0 AND tipo = ? AND entidade_tipo = ? AND entidade_id = ? AND id_utilizador IN (?)`,
        [tipo, entidadeTipo, entidadeId, ids]
    );
    return rows.map((r) => r.id_utilizador);
}

module.exports = {
    criar, obterPorId, listarPorUtilizador, contarNaoLidas, marcarComoLida, marcarTodasComoLidas, eliminar,
    utilizadoresComNaoLidaDaEntidade
};