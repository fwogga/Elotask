const pool = require('../config/database');

const exec = (db) => db || pool;

const CAMPOS = `id_evento, id_criador, titulo, descricao, data_inicio, data_fim, tipo_evento, data_criacao`;

async function criar({ idCriador, titulo, descricao, dataInicio, dataFim, tipoEvento }, db) {
    const [r] = await exec(db).query(
        `INSERT INTO eventos_calendario (id_criador, titulo, descricao, data_inicio, data_fim, tipo_evento)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [idCriador, titulo, descricao, dataInicio, dataFim, tipoEvento]
    );
    return r.insertId;
}

async function obterPorId(idEvento, db) {
    const [rows] = await exec(db).query(
        `SELECT ${CAMPOS} FROM eventos_calendario WHERE id_evento = ?`,
        [idEvento]
    );
    return rows[0] || null;
}

/**
 * Eventos de um utilizador. Com `de`/`ate` devolve os que se sobrepõem a esse intervalo
 * (começam antes de `ate` e terminam depois de `de`). `tipo` filtra por tipo_evento.
 */
async function listarPorCriador(idCriador, { de, ate, tipo, limite = 500 } = {}, db) {
    const condicoes = ['id_criador = ?'];
    const params = [idCriador];
    if (de) { condicoes.push('data_fim >= ?'); params.push(de); }
    if (ate) { condicoes.push('data_inicio <= ?'); params.push(ate); }
    if (tipo) { condicoes.push('tipo_evento = ?'); params.push(tipo); }
    params.push(limite);

    const [rows] = await exec(db).query(
        `SELECT ${CAMPOS} FROM eventos_calendario
          WHERE ${condicoes.join(' AND ')}
          ORDER BY data_inicio, id_evento LIMIT ?`,
        params
    );
    return rows;
}

async function atualizar(idEvento, { titulo, descricao, dataInicio, dataFim, tipoEvento }, db) {
    const campos = [];
    const valores = [];
    if (titulo !== undefined) { campos.push('titulo = ?'); valores.push(titulo); }
    if (descricao !== undefined) { campos.push('descricao = ?'); valores.push(descricao); }
    if (dataInicio !== undefined) { campos.push('data_inicio = ?'); valores.push(dataInicio); }
    if (dataFim !== undefined) { campos.push('data_fim = ?'); valores.push(dataFim); }
    if (tipoEvento !== undefined) { campos.push('tipo_evento = ?'); valores.push(tipoEvento); }
    if (!campos.length) return 0;
    valores.push(idEvento);
    const [r] = await exec(db).query(
        `UPDATE eventos_calendario SET ${campos.join(', ')} WHERE id_evento = ?`,
        valores
    );
    return r.affectedRows;
}

async function eliminar(idEvento, db) {
    const [r] = await exec(db).query('DELETE FROM eventos_calendario WHERE id_evento = ?', [idEvento]);
    return r.affectedRows;
}

module.exports = { criar, obterPorId, listarPorCriador, atualizar, eliminar };