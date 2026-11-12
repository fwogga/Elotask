const pool = require('../config/database');

const exec = (db) => db || pool;

const CAMPOS = `r.id_reuniao, r.titulo, r.descricao, r.id_criador, u.nome AS nome_criador,
                r.data_inicio, r.data_fim, r.tipo_reuniao, r.localizacao, r.link_reuniao, r.estado, r.data_criacao`;

async function criar({ titulo, descricao, idCriador, dataInicio, dataFim, tipoReuniao, localizacao, linkReuniao }, db) {
    const [r] = await exec(db).query(
        `INSERT INTO reunioes (titulo, descricao, id_criador, data_inicio, data_fim, tipo_reuniao, localizacao, link_reuniao)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [titulo, descricao, idCriador, dataInicio, dataFim, tipoReuniao, localizacao, linkReuniao]
    );
    return r.insertId;
}

async function obterPorId(idReuniao, db) {
    const [rows] = await exec(db).query(
        `SELECT ${CAMPOS}
           FROM reunioes r JOIN utilizadores u ON u.id_utilizador = r.id_criador
          WHERE r.id_reuniao = ?`,
        [idReuniao]
    );
    return rows[0] || null;
}

/**
 * Reuniões em que o utilizador participa (incluindo as que organiza), com o estado do SEU convite.
 * `de`/`ate` devolvem as que se sobrepõem a esse intervalo.
 */
async function listarDoUtilizador(idUtilizador, { de, ate, estado, limite = 200 } = {}, db) {
    const condicoes = [];
    const params = [idUtilizador];
    if (de) { condicoes.push('r.data_fim >= ?'); params.push(de); }
    if (ate) { condicoes.push('r.data_inicio <= ?'); params.push(ate); }
    if (estado) { condicoes.push('r.estado = ?'); params.push(estado); }
    params.push(limite);

    const [rows] = await exec(db).query(
        `SELECT ${CAMPOS},
                rp.estado_convite AS meu_convite,
                (SELECT COUNT(*) FROM reuniao_participantes x WHERE x.id_reuniao = r.id_reuniao) AS total_participantes
           FROM reunioes r
           JOIN reuniao_participantes rp ON rp.id_reuniao = r.id_reuniao AND rp.id_utilizador = ?
           JOIN utilizadores u ON u.id_utilizador = r.id_criador
          ${condicoes.length ? 'WHERE ' + condicoes.join(' AND ') : ''}
          ORDER BY r.data_inicio, r.id_reuniao LIMIT ?`,
        params
    );
    return rows;
}

/** Campos omitidos (undefined) não são alterados; null limpa o campo (descrição, localização, link). */
async function atualizar(idReuniao, c, db) {
    const mapa = {
        titulo: 'titulo', descricao: 'descricao', dataInicio: 'data_inicio', dataFim: 'data_fim',
        tipoReuniao: 'tipo_reuniao', localizacao: 'localizacao', linkReuniao: 'link_reuniao'
    };
    const campos = [];
    const valores = [];
    for (const [chave, coluna] of Object.entries(mapa)) {
        if (c[chave] !== undefined) { campos.push(`${coluna} = ?`); valores.push(c[chave]); }
    }
    if (!campos.length) return 0;
    valores.push(idReuniao);
    const [r] = await exec(db).query(`UPDATE reunioes SET ${campos.join(', ')} WHERE id_reuniao = ?`, valores);
    return r.affectedRows;
}

async function atualizarEstado(idReuniao, estado, db) {
    const [r] = await exec(db).query('UPDATE reunioes SET estado = ? WHERE id_reuniao = ?', [estado, idReuniao]);
    return r.affectedRows;
}

/**
 * Intervalos em que cada utilizador está ocupado entre `de` e `ate` (datas 'AAAA-MM-DD HH:MM:SS').
 * Só leitura; junta quatro fontes: reuniões, ausências aprovadas, turnos e eventos de calendário.
 * `excluirReuniao` ignora uma reunião (útil ao reagendar a própria reunião).
 */
async function listarOcupacoes({ idsUtilizadores, de, ate, excluirReuniao = null, limite = 2001 }, db) {
    if (!idsUtilizadores.length) return [];
    const ids = [idsUtilizadores];

    const [rows] = await exec(db).query(
        `(SELECT rp.id_utilizador, r.data_inicio AS inicio, r.data_fim AS fim, 'reuniao' AS motivo
            FROM reuniao_participantes rp
            JOIN reunioes r ON r.id_reuniao = rp.id_reuniao
           WHERE rp.id_utilizador IN (?)
             AND rp.estado_convite <> 'recusado'
             AND r.estado IN ('agendada', 'em_curso')
             AND r.data_fim > r.data_inicio
             AND r.data_inicio < ? AND r.data_fim > ?
             AND (? IS NULL OR r.id_reuniao <> ?))
         UNION ALL
         (SELECT pa.id_utilizador, CAST(pa.data_inicio AS DATETIME),
                 DATE_ADD(CAST(pa.data_fim AS DATETIME), INTERVAL 1 DAY), 'ausencia'
            FROM pedidos_ausencia pa
           WHERE pa.id_utilizador IN (?)
             AND pa.estado = 'aprovado'
             AND pa.data_inicio <= DATE(?) AND pa.data_fim >= DATE(?))
         UNION ALL
         (SELECT tc.id_utilizador, TIMESTAMP(t.data_turno, t.hora_inicio), TIMESTAMP(t.data_turno, t.hora_fim), 'turno'
            FROM turno_colaboradores tc
            JOIN turnos t ON t.id_turno = tc.id_turno
           WHERE tc.id_utilizador IN (?)
             AND tc.estado <> 'cancelado'
             AND t.hora_fim > t.hora_inicio
             AND t.data_turno BETWEEN DATE(?) AND DATE(?))
         UNION ALL
         (SELECT e.id_criador, e.data_inicio, e.data_fim, 'evento'
            FROM eventos_calendario e
           WHERE e.id_criador IN (?)
             AND e.tipo_evento NOT IN ('reuniao', 'prazo')
             AND e.data_fim > e.data_inicio
             AND e.data_inicio < ? AND e.data_fim > ?)
         ORDER BY id_utilizador, inicio
         LIMIT ?`,
        [
            ...ids, ate, de, excluirReuniao, excluirReuniao,
            ...ids, ate, de,
            ...ids, de, ate,
            ...ids, ate, de,
            limite
        ]
    );
    return rows;
}
module.exports = { criar, obterPorId, listarDoUtilizador, atualizar, atualizarEstado, listarOcupacoes };