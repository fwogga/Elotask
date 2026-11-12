const multer = require('multer');
const { HttpError } = require('../utils/httpError');
const env = require('../config/env');

function naoEncontrado(req, res, next) {
    next(new HttpError(404, `Rota não encontrada: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function tratarErros(err, req, res, next) {
    if (res.headersSent) return next(err);

    let status = 500;
    let mensagem = 'Erro interno do servidor.';
    let detalhes;

    if (err instanceof HttpError) {
        status = err.status;
        mensagem = err.message;
        detalhes = err.detalhes;
    } else if (err instanceof multer.MulterError) {
        status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        mensagem = err.code === 'LIMIT_FILE_SIZE'
            ? `Ficheiro demasiado grande (máximo ${Math.round(env.upload.maxBytes / 1048576)} MB).`
            : `Erro no upload: ${err.message}`;
    } else if (err.type === 'entity.parse.failed') {
        status = 400;
        mensagem = 'JSON inválido no corpo do pedido.';
    } else if (err.type === 'entity.too.large') {
        status = 413;
        mensagem = 'Corpo do pedido demasiado grande.';
    } else if (err.code === 'ER_DUP_ENTRY') {
        status = 409;
        mensagem = 'Já existe um registo com estes dados.';
    } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        status = 400;
        mensagem = 'Referência inválida (registo relacionado inexistente).';
    } else if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
        status = 503;
        mensagem = 'Base de dados indisponível.';
    }

    if (status >= 500) console.error(`[erro] ${req.method} ${req.originalUrl}`, err);

    const corpo = { sucesso: false, erro: mensagem };
    if (detalhes) corpo.detalhes = detalhes;
    if (status >= 500 && !env.isProduction) corpo.causa = err.code ? `${err.code}: ${err.message}` : err.message;
    res.status(status).json(corpo);
}

module.exports = { naoEncontrado, tratarErros };