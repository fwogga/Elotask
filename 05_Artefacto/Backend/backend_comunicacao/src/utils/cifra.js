const crypto = require('crypto');
const env = require('../config/env');

// AES-256-GCM: cifra e autentica (qualquer alteração ao conteúdo cifrado é detetada).
// O envelope guardado é JSON: { cifra: 'aes-256-gcm', v: 1, iv, tag, dados } (tudo em base64).
const ALGORITMO = 'aes-256-gcm';
const VERSAO = 1;

function chave() {
    if (!env.chamadas.chave) {
        // Falha fechada: nunca se guarda sinalização em claro por falta de configuração
        const e = new Error('CHAMADAS_CHAVE não configurada: não é possível cifrar a sinalização das chamadas.');
        e.status = 500;
        throw e;
    }
    return env.chamadas.chave;
}

/**
 * `contexto` é autenticado mas não guardado (AAD): amarra o conteúdo à chamada/remetente/tipo,
 * por isso um registo copiado para outra linha deixa de decifrar.
 */
function cifrar(valor, contexto) {
    const iv = crypto.randomBytes(12);
    const c = crypto.createCipheriv(ALGORITMO, chave(), iv);
    c.setAAD(Buffer.from(String(contexto)));
    const dados = Buffer.concat([c.update(JSON.stringify(valor), 'utf8'), c.final()]);
    return {
        cifra: ALGORITMO, v: VERSAO,
        iv: iv.toString('base64'), tag: c.getAuthTag().toString('base64'), dados: dados.toString('base64')
    };
}

/** Devolve o valor original, ou lança erro se o envelope for inválido/adulterado/chave errada. */
function decifrar(envelope, contexto) {
    const e = typeof envelope === 'string' ? JSON.parse(envelope) : envelope;
    if (!e || e.cifra !== ALGORITMO || e.v !== VERSAO) throw new Error('Conteúdo não está cifrado neste formato.');
    const d = crypto.createDecipheriv(ALGORITMO, chave(), Buffer.from(e.iv, 'base64'));
    d.setAAD(Buffer.from(String(contexto)));
    d.setAuthTag(Buffer.from(e.tag, 'base64'));
    const claro = Buffer.concat([d.update(Buffer.from(e.dados, 'base64')), d.final()]);
    return JSON.parse(claro.toString('utf8'));
}

module.exports = { cifrar, decifrar };