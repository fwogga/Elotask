const notificacaoModel = require('../models/notificacao');
const membroConversaModel = require('../models/participanteconversa');
const membroCanalModel = require('../models/membrocanal');
const { erro } = require('../utils/httpError');

// ---------------------------------------------------------------------------
// Emissão em tempo real (ligada mais tarde pelo Socket.IO)
// ---------------------------------------------------------------------------
let emissor = null;

/** O módulo de sockets chama isto no arranque: definirEmissor((idUtilizador, notificacao) => io.to(...).emit(...)) */
function definirEmissor(fn) {
    emissor = fn;
}

function emitir(idUtilizador, notificacao) {
    if (!emissor) return;
    try {
        emissor(idUtilizador, notificacao);
    } catch (e) {
        console.error('[notificacoes] falha ao emitir em tempo real:', e.message);
    }
}

// ---------------------------------------------------------------------------
// Criação (uso interno: outros módulos chamam isto; não há endpoint público de criação,
// para que ninguém possa enviar notificações falsas a outros utilizadores)
// ---------------------------------------------------------------------------

/**
 * Cria uma notificação. Se for chamada dentro de uma transação (`db`), não emite em tempo real
 * (a transação ainda pode falhar); quem a chamar deve emitir depois do commit.
 */
async function criar({ idUtilizador, tipo, titulo, mensagem, entidadeTipo = null, entidadeId = null }, db) {
    const id = await notificacaoModel.criar({ idUtilizador, tipo, titulo, mensagem, entidadeTipo, entidadeId }, db);
    const notificacao = await notificacaoModel.obterPorId(id, db);
    if (!db) emitir(idUtilizador, notificacao);
    return notificacao;
}

const resumo = (texto, max = 100) => (texto.length > max ? `${texto.slice(0, max - 1)}…` : texto);

/**
 * Avisa os outros participantes de uma conversa/canal que chegou uma mensagem nova.
 * - Exclui o remetente.
 * - Só cria aviso a quem ainda não tem um aviso de mensagem NÃO lido dessa conversa/canal.
 * Pensada para ser chamada sem `await` (se falhar, não pode impedir o envio da mensagem).
 */
async function notificarNovaMensagem(ctx, mensagem) {
    const idsMembros = ctx.tipo === 'conversa'
        ? await membroConversaModel.listarIdsAtivos(ctx.id)
        : await membroCanalModel.listarIds(ctx.id);

    const destinatarios = idsMembros.filter((id) => id !== mensagem.id_remetente);
    if (!destinatarios.length) return;

    const jaAvisados = new Set(
        await notificacaoModel.utilizadoresComNaoLidaDaEntidade(destinatarios, 'mensagem', ctx.tipo, ctx.id)
    );
    const nAnexos = (mensagem.anexos || []).length;
    const texto = mensagem.conteudo || (nAnexos ? `Enviou ${nAnexos} anexo${nAnexos > 1 ? 's' : ''}` : '');

    for (const idUtilizador of destinatarios) {
        if (jaAvisados.has(idUtilizador)) continue;
        await criar({
            idUtilizador,
            tipo: 'mensagem',
            titulo: `Nova mensagem de ${mensagem.nome_remetente}`,
            mensagem: resumo(texto),
            entidadeTipo: ctx.tipo,
            entidadeId: ctx.id
        });
    }
}

// ---------------------------------------------------------------------------
// Consulta e gestão pelo próprio utilizador
// ---------------------------------------------------------------------------

async function listar(idUtilizador, opcoes) {
    return notificacaoModel.listarPorUtilizador(idUtilizador, opcoes);
}

async function contarNaoLidas(idUtilizador) {
    return { total: await notificacaoModel.contarNaoLidas(idUtilizador) };
}

/** 404 tanto se não existe como se é de outro utilizador (não revela a existência). */
async function exigirDoUtilizador(idNotificacao, idUtilizador) {
    const n = await notificacaoModel.obterPorId(idNotificacao);
    if (!n || n.id_utilizador !== idUtilizador) throw erro.notFound('Notificação não encontrada.');
    return n;
}

async function marcarComoLida(idNotificacao, idUtilizador) {
    await exigirDoUtilizador(idNotificacao, idUtilizador);
    await notificacaoModel.marcarComoLida(idNotificacao, idUtilizador);
    return notificacaoModel.obterPorId(idNotificacao);
}

async function marcarTodasComoLidas(idUtilizador) {
    return { marcadas: await notificacaoModel.marcarTodasComoLidas(idUtilizador) };
}

async function eliminar(idNotificacao, idUtilizador) {
    await exigirDoUtilizador(idNotificacao, idUtilizador);
    await notificacaoModel.eliminar(idNotificacao, idUtilizador);
    return { eliminada: idNotificacao };
}

module.exports = {
    definirEmissor, criar, notificarNovaMensagem, listar, contarNaoLidas, marcarComoLida, marcarTodasComoLidas, eliminar
};