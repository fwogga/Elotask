const jwt = require('jsonwebtoken');
const env = require('../config/env');
const pool = require('../config/database');
const { erro } = require('../utils/httpError');

/**
 * Identifica o utilizador a partir de um JWT (ou, só com AUTH_MODE=dev, do cabeçalho x-user-id).
 * O JWT deve conter o id em `id_utilizador` (ou `id` / `sub`) e ser assinado com JWT_SECRET.
 * Usado pelo middleware HTTP e pelo handshake do Socket.IO.
 */
async function identificarUtilizador({ token, devUserId } = {}) {
    let id;

    if (token) {
        try {
            const payload = jwt.verify(token, env.jwt.secret);
            id = payload.id_utilizador ?? payload.id ?? payload.sub;
        } catch (e) {
            throw erro.unauthorized(e.name === 'TokenExpiredError' ? 'Sessão expirada.' : 'Token inválido.');
        }
    } else if (env.authMode === 'dev' && devUserId) {
        id = devUserId;
    } else {
        throw erro.unauthorized();
    }

    id = Number(id);
    if (!Number.isInteger(id) || id <= 0) throw erro.unauthorized('Token inválido.');

    const [rows] = await pool.query(
        'SELECT id_utilizador, nome, email, tipo_utilizador, estado FROM utilizadores WHERE id_utilizador = ?',
        [id]
    );
    if (!rows.length || rows[0].estado !== 'ativo') throw erro.unauthorized('Utilizador inexistente ou inativo.');

    const u = rows[0];
    return { id: u.id_utilizador, nome: u.nome, email: u.email, tipo: u.tipo_utilizador };
}

function extrairToken(req) {
    const h = req.headers.authorization || '';
    const m = /^Bearer\s+(.+)$/i.exec(h);
    return m ? m[1].trim() : null;
}

async function autenticar(req, res, next) {
    try {
        req.utilizador = await identificarUtilizador({
            token: extrairToken(req),
            devUserId: req.headers['x-user-id']
        });
        next();
    } catch (e) {
        next(e);
    }
}

function exigirAdmin(req, res, next) {
    if (!req.utilizador || req.utilizador.tipo !== 'admin') return next(erro.forbidden('Requer perfil de administrador.'));
    next();
}

module.exports = { autenticar, exigirAdmin, identificarUtilizador };