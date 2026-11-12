const pool = require('../config/database');

const exec = (db) => db || pool;

// Campos expostos na API (nunca expõe o caminho interno no disco)
const CAMPOS_PUBLICOS = `a.id_anexo, a.id_mensagem, a.nome_ficheiro, a.tipo_mime, a.extensao,
                         a.tamanho_bytes, a.data_upload, a.id_carregador`;

async function criar(idMensagem, idCarregador, f, db) {
    const [r] = await exec(db).query(
        `INSERT INTO anexos_mensagem
           (id_mensagem, nome_ficheiro, nome_armazenamento, caminho_ficheiro, tipo_mime, extensao, tamanho_bytes, id_carregador)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [idMensagem, f.nome_ficheiro, f.nome_armazenamento, f.caminho_ficheiro, f.tipo_mime, f.extensao, f.tamanho_bytes, idCarregador]
    );
    return r.insertId;
}

async function listarPorMensagens(idsMensagens, db) {
    if (!idsMensagens.length) return [];
    const [rows] = await exec(db).query(
        `SELECT ${CAMPOS_PUBLICOS} FROM anexos_mensagem a
          WHERE a.id_mensagem IN (?) ORDER BY a.id_anexo`,
        [idsMensagens]
    );
    return rows;
}

/** Anexo + dados da mensagem (para validar acesso e localizar o ficheiro). */
async function obterParaDownload(idAnexo, db) {
    const [rows] = await exec(db).query(
        `SELECT a.id_anexo, a.id_mensagem, a.nome_ficheiro, a.caminho_ficheiro, a.tipo_mime, a.tamanho_bytes, a.id_carregador,
                m.id_conversa, m.id_canal, m.data_eliminacao
           FROM anexos_mensagem a JOIN mensagens m ON m.id_mensagem = a.id_mensagem
          WHERE a.id_anexo = ?`,
        [idAnexo]
    );
    return rows[0] || null;
}

async function contarPorMensagem(idMensagem, db) {
    const [rows] = await exec(db).query('SELECT COUNT(*) AS total FROM anexos_mensagem WHERE id_mensagem = ?', [idMensagem]);
    return rows[0].total;
}

/** Devolve o anexo (com caminho) para o poder apagar do disco. */
async function obterComCaminho(idAnexo, db) {
    const [rows] = await exec(db).query(
        `SELECT id_anexo, id_mensagem, caminho_ficheiro, id_carregador FROM anexos_mensagem WHERE id_anexo = ?`,
        [idAnexo]
    );
    return rows[0] || null;
}

async function eliminar(idAnexo, db) {
    const [r] = await exec(db).query('DELETE FROM anexos_mensagem WHERE id_anexo = ?', [idAnexo]);
    return r.affectedRows;
}

async function listarCaminhosPorMensagem(idMensagem, db) {
    const [rows] = await exec(db).query('SELECT caminho_ficheiro FROM anexos_mensagem WHERE id_mensagem = ?', [idMensagem]);
    return rows.map((r) => r.caminho_ficheiro);
}

async function eliminarPorMensagem(idMensagem, db) {
    const [r] = await exec(db).query('DELETE FROM anexos_mensagem WHERE id_mensagem = ?', [idMensagem]);
    return r.affectedRows;
}

module.exports = {
    criar, listarPorMensagens, obterParaDownload, contarPorMensagem, obterComCaminho, eliminar,
    listarCaminhosPorMensagem, eliminarPorMensagem
};