const mensagemModel = require('../models/mensagem');
const conversaModel = require('../models/conversa');
const membroConversaModel = require('../models/participanteconversa');
const canalModel = require('../models/canal');
const membroCanalModel = require('../models/membrocanal');
const anexoModel = require('../models/anexo');
const pool = require('../config/database');
const notificacaoService = require('./notificacaoservice');
const { apagarCaminhos } = require('../middleware/upload');
const calcularTipoMensagem = require('../utils/tipoMensagem');
const { erro } = require('../utils/httpError');

// ---------------------------------------------------------------------------
// Acesso: uma mensagem pertence a UMA conversa OU a UM canal (nunca aos dois).
// Só participantes/membros podem ler e escrever.
// ---------------------------------------------------------------------------

/** Devolve { tipo:'conversa', id, eAdmin } ou lança 404/403/409. */
async function acessoConversa(idConversa, idUtilizador, { escrita = false } = {}) {
    const conversa = await conversaModel.obterConversaPorId(idConversa);
    if (!conversa) throw erro.notFound('Conversa não encontrada.');

    const membro = await membroConversaModel.obterAtivo(idConversa, idUtilizador);
    if (!membro) throw erro.forbidden('Não pertence a esta conversa.');

    if (escrita && conversa.estado !== 'ativa') {
        throw erro.conflict('Esta conversa está arquivada ou inativa e não aceita alterações.');
    }
    return {
        tipo: 'conversa',
        id: idConversa,
        eAdmin: conversa.tipo === 'grupo' && membro.papel === 'administrador'
    };
}

/** Devolve { tipo:'canal', id, eAdmin } ou lança 404/403. */
async function acessoCanal(idCanal, idUtilizador) {
    const canal = await canalModel.obterPorId(idCanal);
    if (!canal) throw erro.notFound('Canal não encontrado.');

    const membro = await membroCanalModel.obter(idCanal, idUtilizador);
    if (!membro) throw erro.forbidden('Não é membro deste canal.');

    return { tipo: 'canal', id: idCanal, eAdmin: membro.papel === 'administrador' };
}

/** Acesso ao contexto (conversa ou canal) a que uma mensagem existente pertence. */
function acessoDaMensagem(msg, idUtilizador, opcoes) {
    return msg.id_conversa
        ? acessoConversa(msg.id_conversa, idUtilizador, opcoes)
        : acessoCanal(msg.id_canal, idUtilizador);
}

async function obterExistente(idMensagem) {
    const msg = await mensagemModel.obterBasico(idMensagem);
    if (!msg || msg.data_eliminacao) throw erro.notFound('Mensagem não encontrada.');
    return msg;
}

// ---------------------------------------------------------------------------
// Histórico
// ---------------------------------------------------------------------------

async function listarDaConversa(idConversa, idUtilizador, paginacao) {
    await acessoConversa(idConversa, idUtilizador);
    return mensagemModel.listarPorConversa(idConversa, paginacao);
}

async function listarDoCanal(idCanal, idUtilizador, paginacao) {
    await acessoCanal(idCanal, idUtilizador);
    return mensagemModel.listarPorCanal(idCanal, paginacao);
}

// ---------------------------------------------------------------------------
// Envio
// ---------------------------------------------------------------------------

/** A mensagem respondida tem de existir, não estar eliminada e ser do mesmo contexto. */
async function validarResposta(idResposta, ctx) {
    if (!idResposta) return null;
    const original = await mensagemModel.obterBasico(idResposta);
    if (!original || original.data_eliminacao) throw erro.badRequest('A mensagem a que quer responder não existe.');

    const mesmoContexto = ctx.tipo === 'conversa'
        ? original.id_conversa === ctx.id
        : original.id_canal === ctx.id;
    if (!mesmoContexto) throw erro.badRequest('Só pode responder a mensagens da mesma conversa/canal.');
    return idResposta;
}

/** `ficheiros` são os descritores devolvidos por descreverFicheiros() (middleware/upload). */
async function enviar(ctx, idRemetente, { conteudo, idMensagemResposta, ficheiros = [] }) {
    if (!conteudo && !ficheiros.length) throw erro.badRequest('A mensagem tem de ter texto ou pelo menos um anexo.');
    const idResposta = await validarResposta(idMensagemResposta, ctx);

    // Mensagem e anexos gravam-se juntos: ou fica tudo, ou nada
    const id = await pool.withTransaction(async (conn) => {
        const idNova = await mensagemModel.criar({
            idConversa: ctx.tipo === 'conversa' ? ctx.id : null,
            idCanal: ctx.tipo === 'canal' ? ctx.id : null,
            idRemetente,
            conteudo: conteudo || null,
            tipoMensagem: calcularTipoMensagem(conteudo, ficheiros),
            idMensagemResposta: idResposta
        }, conn);
        for (const f of ficheiros) await anexoModel.criar(idNova, idRemetente, f, conn);
        return idNova;
    });
    const mensagem = await mensagemModel.obterPorId(id);

    // Avisa os outros participantes. Sem await: se falhar, a mensagem já foi enviada com sucesso.
    notificacaoService.notificarNovaMensagem(ctx, mensagem)
        .catch((e) => console.error('[notificacoes] falha ao notificar nova mensagem:', e.message));

    return mensagem;
}

async function enviarNaConversa(idConversa, idRemetente, dados) {
    const ctx = await acessoConversa(idConversa, idRemetente, { escrita: true });
    return enviar(ctx, idRemetente, dados);
}

async function enviarNoCanal(idCanal, idRemetente, dados) {
    const ctx = await acessoCanal(idCanal, idRemetente);
    return enviar(ctx, idRemetente, dados);
}

// ---------------------------------------------------------------------------
// Edição e eliminação
// ---------------------------------------------------------------------------

/** Só o autor edita, e apenas enquanto ainda tem acesso ao contexto. */
async function editar(idMensagem, idUtilizador, conteudo) {
    const msg = await obterExistente(idMensagem);
    await acessoDaMensagem(msg, idUtilizador, { escrita: true });
    if (msg.id_remetente !== idUtilizador) throw erro.forbidden('Só o autor pode editar a mensagem.');

    await mensagemModel.editar(idMensagem, conteudo);
    // uma mensagem que só tinha ficheiros passa a "mista" ao ganhar texto
    const anexos = await anexoModel.listarPorMensagens([idMensagem]);
    await mensagemModel.atualizarTipo(idMensagem, calcularTipoMensagem(conteudo, anexos));
    return mensagemModel.obterPorId(idMensagem);
}

/**
 * Eliminação lógica (o registo fica, o conteúdo é removido).
 * O autor elimina as suas; administradores de grupo/canal eliminam as de outros.
 */
async function eliminar(idMensagem, idUtilizador) {
    const msg = await obterExistente(idMensagem);
    const ctx = await acessoDaMensagem(msg, idUtilizador);
    if (msg.id_remetente !== idUtilizador && !ctx.eAdmin) {
        throw erro.forbidden('Só o autor ou um administrador pode eliminar esta mensagem.');
    }
    // Ao eliminar a mensagem, os ficheiros anexados também são apagados (BD e disco)
    const caminhos = await anexoModel.listarCaminhosPorMensagem(idMensagem);
    await pool.withTransaction(async (conn) => {
        await mensagemModel.eliminar(idMensagem, conn);
        await anexoModel.eliminarPorMensagem(idMensagem, conn);
    });
    await apagarCaminhos(caminhos);

    return { eliminada: idMensagem, id_conversa: msg.id_conversa, id_canal: msg.id_canal };
}

module.exports = {
    listarDaConversa, listarDoCanal, enviarNaConversa, enviarNoCanal, editar, eliminar,
    // usados pelos anexos e pelas rotas (verificações antes de receber ficheiros)
    acessoConversa, acessoCanal, acessoDaMensagem, obterExistente
};