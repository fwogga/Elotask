const env = require('../config/env');
const { HttpError, erro } = require('../utils/httpError');

// Cliente HTTP do serviço de IA em Python (componente separado, ver .env: IA_SERVICE_URL / IA_SERVICE_API_KEY).
// Regra: o que correu mal fica no log do servidor; ao cliente só chega uma mensagem genérica.

async function pedir(metodo, caminho, corpo) {
    if (!env.ia.apiKey) throw erro.unavailable('O serviço de IA não está configurado.'); // falha fechada

    let resposta;
    try {
        resposta = await fetch(`${env.ia.url}${caminho}`, {
            method: metodo,
            headers: { 'Content-Type': 'application/json', 'X-API-Key': env.ia.apiKey },
            body: corpo === undefined ? undefined : JSON.stringify(corpo),
            signal: AbortSignal.timeout(env.ia.timeoutMs)
        });
    } catch (e) {
        const demorou = e.name === 'TimeoutError' || e.name === 'AbortError';
        console.error(`[ia] ${metodo} ${caminho} falhou:`, demorou ? 'timeout' : (e.cause?.code || e.message));
        throw erro.unavailable(demorou ? 'O serviço de IA demorou demasiado a responder.' : 'O serviço de IA está indisponível.');
    }

    let dados = null;
    try {
        const texto = await resposta.text();
        dados = texto ? JSON.parse(texto) : null;
    } catch (e) { /* corpo não é JSON: tratado abaixo */ }

    if (!resposta.ok) {
        console.error(`[ia] ${metodo} ${caminho} -> ${resposta.status}:`, JSON.stringify(dados?.detail ?? dados));
        throw new HttpError(502, 'O serviço de IA devolveu um erro.');
    }
    if (dados === null || typeof dados !== 'object') {
        console.error(`[ia] ${metodo} ${caminho} -> resposta sem JSON válido.`);
        throw new HttpError(502, 'O serviço de IA devolveu uma resposta inválida.');
    }
    return dados;
}

/** O serviço de IA está de pé? (não exige chave; nunca lança) */
async function estaDisponivel() {
    try {
        const r = await fetch(`${env.ia.url}/health`, { signal: AbortSignal.timeout(Math.min(env.ia.timeoutMs, 3000)) });
        return r.ok;
    } catch (e) {
        return false;
    }
}

const chat = (pedido) => pedir('POST', '/chat', pedido);
const resumirReuniao = (pedido) => pedir('POST', '/resumir-reuniao', pedido);
const sugerirHorarios = (pedido) => pedir('POST', '/sugerir-horarios', pedido);   // <-- nova
const sugerir = (pedido) => pedir('POST', '/sugestoes', pedido);

module.exports = { estaDisponivel, chat, resumirReuniao, sugerirHorarios, sugerir };