const pool = require('../config/database');

// Permite usar a mesma função dentro de uma transação (passando `db`) ou fora dela (usa o pool).
const exec = (db) => db || pool;

const ATIVAS = `('iniciada','em_curso')`;

const CAMPOS = `c.id_chamada, c.id_conversa, c.id_reuniao, c.id_iniciador, u.nome AS nome_iniciador,
                c.tipo_chamada, c.data_inicio, c.data_fim, c.estado, c.motivo_fim,
                TIMESTAMPDIFF(SECOND, c.data_inicio, COALESCE(c.data_fim, NOW())) AS duracao_segundos`;

/** Cria a chamada. Estado inicial: 'iniciada' (a tocar). */
async function criar({ idConversa, idReuniao, idIniciador, tipoChamada }, db) {
    const [r] = await exec(db).query(
        'INSERT INTO chamadas (id_conversa, id_reuniao, id_iniciador, tipo_chamada) VALUES (?, ?, ?, ?)',
        [idConversa || null, idReuniao || null, idIniciador, tipoChamada]
    );
    return r.insertId;
}

/** `segundos_desde_inicio` serve para detetar chamadas que ninguém atendeu. */
async function obterPorId(idChamada, db) {
    const [rows] = await exec(db).query(
        `SELECT ${CAMPOS}, TIMESTAMPDIFF(SECOND, c.data_inicio, NOW()) AS segundos_desde_inicio
           FROM chamadas c JOIN utilizadores u ON u.id_utilizador = c.id_iniciador
          WHERE c.id_chamada = ?`,
        [idChamada]
    );
    return rows[0] || null;
}

/** Histórico das chamadas em que o utilizador foi convidado/participou (cursor por id decrescente). */
async function listarDoUtilizador(idUtilizador, { estado, limite, antes }, db) {
    const params = [idUtilizador];
    let filtros = '';
    if (estado) { filtros += ' AND c.estado = ?'; params.push(estado); }
    if (antes) { filtros += ' AND c.id_chamada < ?'; params.push(antes); }
    params.push(limite + 1);

    const [rows] = await exec(db).query(
        `SELECT ${CAMPOS}, pc.estado_participacao AS meu_estado
           FROM chamadas c
           JOIN participantes_chamada pc ON pc.id_chamada = c.id_chamada AND pc.id_utilizador = ?
           JOIN utilizadores u ON u.id_utilizador = c.id_iniciador
          WHERE 1 = 1${filtros}
          ORDER BY c.id_chamada DESC LIMIT ?`,
        params
    );
    const temMais = rows.length > limite;
    const pagina = rows.slice(0, limite);
    return { chamadas: pagina, proximo_cursor: temMais ? pagina[pagina.length - 1].id_chamada : null };
}

/** Id da chamada ainda ativa de uma conversa ou reunião (se existir). */
async function obterIdAtiva(coluna, valor, db) {
    if (!['id_conversa', 'id_reuniao'].includes(coluna)) throw new Error('Coluna inválida.');
    const [rows] = await exec(db).query(
        `SELECT id_chamada FROM chamadas WHERE ${coluna} = ? AND estado IN ${ATIVAS} ORDER BY id_chamada DESC LIMIT 1`,
        [valor]
    );
    return rows[0] ? rows[0].id_chamada : null;
}

/** Chamadas ativas em que o utilizador está dentro da chamada (aceitou e não saiu). */
async function listarIdsEmChamada(idUtilizador, db) {
    const [rows] = await exec(db).query(
        `SELECT pc.id_chamada
           FROM participantes_chamada pc JOIN chamadas c ON c.id_chamada = pc.id_chamada
          WHERE pc.id_utilizador = ? AND pc.estado_participacao = 'aceite' AND pc.data_saida IS NULL
            AND c.estado IN ${ATIVAS}`,
        [idUtilizador]
    );
    return rows.map((r) => r.id_chamada);
}

/** Chamadas ativas em que o utilizador foi convidado ou já está dentro (inclui "a tocar"). */
async function listarIdsAtivasDoUtilizador(idUtilizador, db) {
    const [rows] = await exec(db).query(
        `SELECT pc.id_chamada
           FROM participantes_chamada pc JOIN chamadas c ON c.id_chamada = pc.id_chamada
          WHERE pc.id_utilizador = ? AND pc.estado_participacao IN ('convidado','aceite') AND pc.data_saida IS NULL
            AND c.estado IN ${ATIVAS}
          ORDER BY pc.id_chamada DESC`,
        [idUtilizador]
    );
    return rows.map((r) => r.id_chamada);
}

/** Termina a chamada (só se ainda estiver ativa). Devolve 0 se já tinha terminado. */
async function encerrar(idChamada, estado, motivoFim, db) {
    const [r] = await exec(db).query(
        `UPDATE chamadas SET estado = ?, motivo_fim = ?, data_fim = NOW()
          WHERE id_chamada = ? AND estado IN ${ATIVAS}`,
        [estado, motivoFim, idChamada]
    );
    return r.affectedRows;
}

/** 'iniciada' -> 'em_curso' (quando alguém atende). */
async function passarEmCurso(idChamada, db) {
    const [r] = await exec(db).query(
        `UPDATE chamadas SET estado = 'em_curso' WHERE id_chamada = ? AND estado = 'iniciada'`,
        [idChamada]
    );
    return r.affectedRows;
}

module.exports = {
    criar, obterPorId, listarDoUtilizador, obterIdAtiva, listarIdsEmChamada, listarIdsAtivasDoUtilizador,
    encerrar, passarEmCurso
};