const pool = require('../config/database');
const { cifrar, decifrar } = require('../utils/cifra');

const exec = (db) => db || pool;

// A sinalização (ofertas/respostas SDP, candidatos ICE) contém IPs e fingerprints dos participantes.
// NUNCA é guardada em claro: sinalizacao_chamada.conteudo recebe sempre o envelope cifrado (AES-256-GCM).
// O áudio/vídeo não passa pelo servidor nem pela BD: vai diretamente entre os participantes (DTLS-SRTP).

// Liga cada registo à sua chamada, remetente e tipo: se alguém copiar uma linha para outra, deixa de decifrar.
const contexto = (idChamada, idRemetente, tipoMensagem) => `chamada:${idChamada}:${idRemetente}:${tipoMensagem}`;

async function criar({ idChamada, idRemetente, tipoMensagem, conteudo }, db) {
    const cifrado = cifrar(conteudo, contexto(idChamada, idRemetente, tipoMensagem)); // falha antes de tocar na BD
    const [r] = await exec(db).query(
        'INSERT INTO sinalizacao_chamada (id_chamada, id_remetente, tipo_mensagem, conteudo) VALUES (?, ?, ?, ?)',
        [idChamada, idRemetente, tipoMensagem, JSON.stringify(cifrado)]
    );
    return r.insertId;
}

/** Devolve a sinalização decifrada. Registos antigos em claro ou adulterados vêm com conteudo = null. */
async function listarPorChamada(idChamada, db) {
    const [rows] = await exec(db).query(
        `SELECT id_sinalizacao, id_chamada, id_remetente, tipo_mensagem, conteudo, data_criacao
           FROM sinalizacao_chamada WHERE id_chamada = ? ORDER BY id_sinalizacao`,
        [idChamada]
    );
    return rows.map((r) => {
        let conteudo = null;
        try {
            conteudo = decifrar(r.conteudo, contexto(r.id_chamada, r.id_remetente, r.tipo_mensagem));
        } catch (e) { /* ilegível: não expor */ }
        return { ...r, conteudo };
    });
}

/** Apaga a sinalização de uma chamada (já não serve depois de terminar). */
async function apagarPorChamada(idChamada, db) {
    const [r] = await exec(db).query('DELETE FROM sinalizacao_chamada WHERE id_chamada = ?', [idChamada]);
    return r.affectedRows;
}

module.exports = { criar, listarPorChamada, apagarPorChamada };