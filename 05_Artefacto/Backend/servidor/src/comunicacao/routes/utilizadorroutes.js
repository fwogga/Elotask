const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const pool = require('../config/database');
const env = require('../config/env');
const { autenticar } = require('../middleware/auth');
const v = require('../middleware/validation');
const { erro } = require('../utils/httpError');

// Montado em /api. Dá ao frontend a lista de pessoas, o registo e uma entrada sem palavra-passe para testes.
// O login com palavra-passe é o de /autenticacao/login (parte principal); os tokens são os mesmos.
const router = express.Router();
const ok = (res, dados, status = 200) => res.status(status).json({ sucesso: true, dados });

const CAMPOS = 'id_utilizador, nome, email, tipo_utilizador, telefone, cargo, estado, data_criacao';

async function porEmail(email) {
    const [rows] = await pool.query(`SELECT ${CAMPOS} FROM utilizadores WHERE email = ?`, [email]);
    return rows[0] || null;
}

async function porId(id) {
    const [rows] = await pool.query(`SELECT ${CAMPOS} FROM utilizadores WHERE id_utilizador = ?`, [id]);
    return rows[0] || null;
}

// Só existe com AUTH_MODE=dev: entra pelo email, sem palavra-passe
function soEmDev(req, res, next) {
    if (env.authMode !== 'dev') return next(erro.notFound('Disponível só com AUTH_MODE=dev.'));
    next();
}

router.post('/auth/entrar', soEmDev, asyncHandler(async (req, res) => {
    const email = (v.texto((req.body || {}).email, 'email', { max: 150 }) || '').toLowerCase();
    let utilizador;
    if (email) {
        utilizador = await porEmail(email);
    } else {
        // Sem email: entra com o primeiro utilizador ativo (útil para demonstrações)
        const [rows] = await pool.query(`SELECT ${CAMPOS} FROM utilizadores WHERE estado = 'ativo' ORDER BY id_utilizador LIMIT 1`);
        utilizador = rows[0];
    }
    if (!utilizador) throw erro.notFound('Não existe nenhuma conta com esse email.');
    if (utilizador.estado !== 'ativo') throw erro.forbidden('A conta está inativa ou suspensa.');
    // Mesmo formato de token que o backend principal ({ id, perfil }), para servir nos dois
    const token = env.jwt.secret
        ? jwt.sign({ id: utilizador.id_utilizador, perfil: utilizador.tipo_utilizador }, env.jwt.secret, { expiresIn: env.jwt.expiresIn })
        : null;
    ok(res, { ...utilizador, token });
}));

router.post('/auth/registar', asyncHandler(async (req, res) => {
    const b = req.body || {};
    const email = (v.texto(b.email, 'email', { max: 150 }) || '').toLowerCase();
    if (email) {
        const existente = await porEmail(email);
        if (existente) return ok(res, existente);
    }
    // Sem palavra-passe a conta só entra pela entrada de testes (/auth/entrar)
    const hash = b.palavra ? await bcrypt.hash(String(b.palavra), 10) : 'DEV_SEM_PALAVRA_PASSE';
    const [r] = await pool.query(
        `INSERT INTO utilizadores (nome, email, password_hash, telefone, cargo) VALUES (?, ?, ?, ?, 'Colaborador')`,
        [v.texto(b.nome, 'nome', { max: 100 }) || 'Novo utilizador', email || `utilizador${Date.now()}@elotask.pt`, hash, v.texto(b.telefone, 'telefone', { max: 20 })]
    );
    ok(res, await porId(r.insertId), 201);
}));

router.get('/utilizadores', autenticar, asyncHandler(async (req, res) => {
    const [rows] = await pool.query(`SELECT ${CAMPOS} FROM utilizadores ORDER BY nome`);
    ok(res, rows);
}));

router.get('/utilizadores/eu', autenticar, asyncHandler(async (req, res) => {
    ok(res, await porId(req.utilizador.id));
}));

module.exports = router;
