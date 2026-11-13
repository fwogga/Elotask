const { erro } = require('../utils/httpError');

function inteiroPositivo(valor, nome = 'id') {
    const n = Number(valor);
    if (valor === null || valor === undefined || valor === '' || !Number.isInteger(n) || n <= 0) {
        throw erro.badRequest(`${nome} inválido.`);
    }
    return n;
}

function inteiroPositivoOpcional(valor, nome) {
    if (valor === undefined || valor === null || valor === '') return null;
    return inteiroPositivo(valor, nome);
}

function texto(valor, nome, { obrigatorio = false, max = 255, min = 1 } = {}) {
    if (valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() === '')) {
        if (obrigatorio) throw erro.badRequest(`${nome} é obrigatório.`);
        return null;
    }
    if (typeof valor !== 'string') throw erro.badRequest(`${nome} deve ser texto.`);
    const t = valor.trim();
    if (t.length < min) throw erro.badRequest(`${nome} demasiado curto.`);
    if (t.length > max) throw erro.badRequest(`${nome} excede ${max} caracteres.`);
    return t;
}

function opcao(valor, permitidos, nome, { obrigatorio = false } = {}) {
    if (valor === undefined || valor === null || valor === '') {
        if (obrigatorio) throw erro.badRequest(`${nome} é obrigatório.`);
        return null;
    }
    if (!permitidos.includes(valor)) throw erro.badRequest(`${nome} inválido. Valores permitidos: ${permitidos.join(', ')}.`);
    return valor;
}

function listaIds(valor, nome = 'ids') {
    if (valor === undefined || valor === null || valor === '') return [];
    if (!Array.isArray(valor)) throw erro.badRequest(`${nome} deve ser uma lista.`);
    return [...new Set(valor.map((v) => inteiroPositivo(v, nome)))];
}

const pad = (n) => String(n).padStart(2, '0');
const fmtUTC = (d) =>
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;

/**
 * Converte para "YYYY-MM-DD HH:MM:SS".
 * Datas sem fuso ("2026-10-20T15:00" / "2026-10-20 15:00:00") mantêm-se tal como foram enviadas;
 * datas com fuso (Z / +01:00) são convertidas para UTC.
 */
function dataHora(valor, nome, { obrigatorio = false } = {}) {
    if (valor === undefined || valor === null || valor === '') {
        if (obrigatorio) throw erro.badRequest(`${nome} é obrigatória.`);
        return null;
    }
    if (typeof valor !== 'string') throw erro.badRequest(`${nome} inválida.`);
    const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::(\d{2}))?$/.exec(valor.trim());
    if (m) {
        const d = new Date(`${m[1]}T${m[2]}:${m[3] || '00'}Z`);
        if (Number.isNaN(d.getTime())) throw erro.badRequest(`${nome} inválida.`);
        return `${m[1]} ${m[2]}:${m[3] || '00'}`;
    }
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) throw erro.badRequest(`${nome} inválida.`);
    return fmtUTC(d);
}

/** Filtro de data em query string: aceita "YYYY-MM-DD" (dia inteiro) ou data/hora completa. */
function dataFiltro(valor, nome, fimDoDia = false) {
    if (valor === undefined || valor === null || valor === '') return null;
    if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor.trim())) {
        dataHora(`${valor.trim()} 00:00:00`, nome); // valida que a data existe
        return `${valor.trim()} ${fimDoDia ? '23:59:59' : '00:00:00'}`;
    }
    return dataHora(valor, nome);
}

/** Só aceita URLs http(s) (bloqueia javascript:, data:, etc.). */
function urlHttp(valor, nome, { max = 500 } = {}) {
    const t = texto(valor, nome, { max });
    if (t === null) return null;
    let url;
    try { url = new URL(t); } catch (_) { throw erro.badRequest(`${nome} inválido.`); }
    if (!['http:', 'https:'].includes(url.protocol)) throw erro.badRequest(`${nome} deve começar por http:// ou https://.`);
    return t;
}

function paginacao(query, { limiteDefault = 30, limiteMax = 100 } = {}) {
    let limite = query.limite === undefined ? limiteDefault : Number(query.limite);
    if (!Number.isInteger(limite) || limite <= 0) throw erro.badRequest('limite inválido.');
    limite = Math.min(limite, limiteMax);
    const antes = query.antes === undefined || query.antes === '' ? null : inteiroPositivo(query.antes, 'antes');
    return { limite, antes };
}

/** Middleware: valida e converte parâmetros de rota (ex.: validarParams('idConversa')). */
function validarParams(...nomes) {
    return (req, res, next) => {
        try {
            for (const nome of nomes) req.params[nome] = inteiroPositivo(req.params[nome], nome);
            next();
        } catch (e) {
            next(e);
        }
    };
}

module.exports = {
    inteiroPositivo, inteiroPositivoOpcional, texto, opcao, listaIds, dataHora, dataFiltro, urlHttp, paginacao, validarParams
};
