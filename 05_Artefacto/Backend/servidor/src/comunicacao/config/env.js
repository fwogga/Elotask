require('dotenv').config();

const num = (valor, padrao) => {
    const n = Number(valor);
    return Number.isFinite(n) && valor !== undefined && valor !== '' ? n : padrao;
};
const bool = (valor, padrao) =>
    valor === undefined || valor === '' ? padrao : ['1', 'true', 'sim', 'yes'].includes(String(valor).toLowerCase());
const lista = (valor) => String(valor || '').split(',').map((s) => s.trim()).filter(Boolean);

const nodeEnv = process.env.NODE_ENV || 'development';

const env = {
    nodeEnv,
    isProduction: nodeEnv === 'production',
    port: process.env.PORT || 3000,

    database: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'root',
        name: process.env.DB_NAME || 'elotask'
    },

    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

    authMode: process.env.AUTH_MODE || 'jwt',
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '8h'
    },

    corsOrigins: lista(process.env.CORS_ORIGIN || '*'),

    upload: {
        maxBytes: num(process.env.UPLOAD_MAX_MB, 10) * 1024 * 1024,
        maxFiles: num(process.env.UPLOAD_MAX_FILES, 5)
    },

    ia: {
        url: (process.env.IA_SERVICE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, ''),
        timeoutMs: num(process.env.IA_SERVICE_TIMEOUT_MS, 30000),
        apiKey: process.env.IA_SERVICE_API_KEY || ''
    },

    webrtc: {
        stunUrls: lista(process.env.STUN_URLS || 'stun:stun.l.google.com:19302'),
        turnUrl: process.env.TURN_URL || '',
        turnUsername: process.env.TURN_USERNAME || '',
        turnCredential: process.env.TURN_CREDENTIAL || ''
    },

    // Chave AES-256 (32 bytes em base64) que cifra a sinalização das chamadas antes de ir para a BD
    chamadas: {
        chave: process.env.CHAMADAS_CHAVE ? Buffer.from(process.env.CHAMADAS_CHAVE, 'base64') : null
    },

    lembretes: {
        ativos: bool(process.env.LEMBRETES_ATIVOS, true),
        intervaloS: num(process.env.LEMBRETES_INTERVALO_S, 60)
    }
};

// Validações de arranque (falhar cedo, com mensagem clara)
if (!['jwt', 'dev'].includes(env.authMode)) {
    throw new Error('AUTH_MODE inválido: use "jwt" ou "dev".');
}
if (env.authMode === 'dev' && env.isProduction) {
    throw new Error('AUTH_MODE=dev não é permitido em produção.');
}
if (env.authMode === 'jwt' && !env.jwt.secret) {
    throw new Error('JWT_SECRET não definido no .env (necessário com AUTH_MODE=jwt).');
}
if (env.chamadas.chave && env.chamadas.chave.length !== 32) {
    throw new Error('CHAMADAS_CHAVE inválida: tem de ser 32 bytes em base64 (ver .env.example).');
}
if (!env.chamadas.chave) {
    if (env.isProduction) throw new Error('CHAMADAS_CHAVE não definida no .env (obrigatória em produção).');
    console.warn('[aviso] CHAMADAS_CHAVE não definida: a sinalização de chamadas será recusada até ser configurada.');
}

module.exports = env;