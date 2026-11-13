const pool = require('../config/database');

const exec = (db) => db || pool;

// Estados de estado_participacao (enum da BD):
//   convidado -> aceite -> participou   (atendeu e depois saiu / a chamada acabou)
//   convidado -> recusado               (recusou)
//   convidado -> ausente                (nunca atendeu e a chamada acabou)

async function obter(idChamada, idUtilizador, db) {
    const [rows] = await exec(db).query(
        `SELECT id_chamada, id_utilizador, data_entrada, data_saida, estado_participacao
           FROM participantes_chamada WHERE id_chamada = ? AND id_utilizador = ?`,
        [idChamada, idUtilizador]
    );
    return rows[0] || null;
}

/** O iniciador entra já como 'aceite'; os restantes ficam 'convidado' (a tocar). */
async function adicionar(idChamada, idUtilizador, estadoParticipacao, db) {
    const [r] = await exec(db).query(
        `INSERT IGNORE INTO participantes_chamada (id_chamada, id_utilizador, estado_participacao)
         VALUES (?, ?, ?)`,
        [idChamada, idUtilizador, estadoParticipacao]
    );
    return r.affectedRows;
}

async function listar(idChamada, db) {
    const [rows] = await exec(db).query(
        `SELECT pc.id_utilizador, u.nome, u.foto_perfil, pc.estado_participacao, pc.data_entrada, pc.data_saida
           FROM participantes_chamada pc JOIN utilizadores u ON u.id_utilizador = pc.id_utilizador
          WHERE pc.id_chamada = ?
          ORDER BY pc.data_entrada, u.nome`,
        [idChamada]
    );
    return rows;
}

async function listarIdsPorEstado(idChamada, estadoParticipacao, db) {
    const [rows] = await exec(db).query(
        'SELECT id_utilizador FROM participantes_chamada WHERE id_chamada = ? AND estado_participacao = ?',
        [idChamada, estadoParticipacao]
    );
    return rows.map((r) => r.id_utilizador);
}

/** Entrar (ou voltar a entrar) na chamada: data_entrada passa a ser o momento em que entrou. */
async function entrar(idChamada, idUtilizador, db) {
    const [r] = await exec(db).query(
        `UPDATE participantes_chamada
            SET estado_participacao = 'aceite', data_entrada = NOW(), data_saida = NULL
          WHERE id_chamada = ? AND id_utilizador = ?`,
        [idChamada, idUtilizador]
    );
    return r.affectedRows;
}

/** Só se pode recusar um convite que ainda está pendente. */
async function recusar(idChamada, idUtilizador, db) {
    const [r] = await exec(db).query(
        `UPDATE participantes_chamada SET estado_participacao = 'recusado'
          WHERE id_chamada = ? AND id_utilizador = ? AND estado_participacao = 'convidado'`,
        [idChamada, idUtilizador]
    );
    return r.affectedRows;
}

/** Só sai quem está dentro (aceite e ainda sem data_saida). */
async function sair(idChamada, idUtilizador, db) {
    const [r] = await exec(db).query(
        `UPDATE participantes_chamada SET estado_participacao = 'participou', data_saida = NOW()
          WHERE id_chamada = ? AND id_utilizador = ? AND estado_participacao = 'aceite' AND data_saida IS NULL`,
        [idChamada, idUtilizador]
    );
    return r.affectedRows;
}

/** Quantos estão agora dentro da chamada. */
async function contarEmChamada(idChamada, db) {
    const [rows] = await exec(db).query(
        `SELECT COUNT(*) AS total FROM participantes_chamada
          WHERE id_chamada = ? AND estado_participacao = 'aceite' AND data_saida IS NULL`,
        [idChamada]
    );
    return rows[0].total;
}

/** Fecha as contas quando a chamada termina: quem estava dentro "participou"; quem nunca atendeu fica "ausente". */
async function encerrarTodos(idChamada, db) {
    await exec(db).query(
        `UPDATE participantes_chamada SET estado_participacao = 'participou', data_saida = NOW()
          WHERE id_chamada = ? AND estado_participacao = 'aceite' AND data_saida IS NULL`,
        [idChamada]
    );
    await exec(db).query(
        `UPDATE participantes_chamada SET estado_participacao = 'ausente'
          WHERE id_chamada = ? AND estado_participacao = 'convidado'`,
        [idChamada]
    );
}

module.exports = {
    obter, adicionar, listar, listarIdsPorEstado, entrar, recusar, sair, contarEmChamada, encerrarTodos
};