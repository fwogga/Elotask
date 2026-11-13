const fs = require('fs');
const pool = require('../config/database');
const anexoModel = require('../models/anexo');
const mensagemModel = require('../models/mensagem');
const mensagemService = require('./mensagemservice');
const { resolverCaminhoSeguro, apagarCaminhos } = require('../middleware/upload');
const calcularTipoMensagem = require('../utils/tipoMensagem');
const { erro } = require('../utils/httpError');

const MAX_ANEXOS_POR_MENSAGEM = 10;

/**
 * Verifica se o utilizador pode acrescentar ficheiros à mensagem.
 * Chamada ANTES de receber os ficheiros, para não gravar nada em disco a quem não tem permissão.
 */
async function verificarPodeAnexar(idMensagem, idUtilizador) {
    const msg = await mensagemService.obterExistente(idMensagem);
    await mensagemService.acessoDaMensagem(msg, idUtilizador, { escrita: true });
    if (msg.id_remetente !== idUtilizador) throw erro.forbidden('Só o autor pode acrescentar anexos à mensagem.');
    return msg;
}

/** Acrescenta ficheiros a uma mensagem do próprio utilizador. */
async function adicionar(idMensagem, idUtilizador, ficheiros) {
    const msg = await verificarPodeAnexar(idMensagem, idUtilizador);

    if ((await anexoModel.contarPorMensagem(idMensagem)) + ficheiros.length > MAX_ANEXOS_POR_MENSAGEM) {
        throw erro.badRequest(`Uma mensagem pode ter no máximo ${MAX_ANEXOS_POR_MENSAGEM} anexos.`);
    }

    await pool.withTransaction(async (conn) => {
        for (const f of ficheiros) await anexoModel.criar(idMensagem, idUtilizador, f, conn);
        const todos = await anexoModel.listarPorMensagens([idMensagem], conn);
        await mensagemModel.atualizarTipo(idMensagem, calcularTipoMensagem(msg.conteudo, todos), conn);
    });
    return mensagemModel.obterPorId(idMensagem);
}

/** Acesso de leitura ao anexo = acesso à conversa/canal da mensagem. Quem não tem acesso recebe 404. */
async function acessoDoAnexo(anexo, idUtilizador) {
    try {
        return anexo.id_conversa
            ? await mensagemService.acessoConversa(anexo.id_conversa, idUtilizador)
            : await mensagemService.acessoCanal(anexo.id_canal, idUtilizador);
    } catch (e) {
        if (e.status === 403 || e.status === 404) throw erro.notFound('Anexo não encontrado.');
        throw e;
    }
}

async function obterAnexoVisivel(idAnexo, idUtilizador) {
    const anexo = await anexoModel.obterParaDownload(idAnexo);
    if (!anexo || anexo.data_eliminacao) throw erro.notFound('Anexo não encontrado.');
    const ctx = await acessoDoAnexo(anexo, idUtilizador);
    return { anexo, ctx };
}

/** Devolve o que o controlador precisa para enviar o ficheiro. */
async function descarregar(idAnexo, idUtilizador) {
    const { anexo } = await obterAnexoVisivel(idAnexo, idUtilizador);

    const caminho = resolverCaminhoSeguro(anexo.caminho_ficheiro);
    if (!caminho) throw erro.notFound('Anexo não encontrado.');
    try {
        await fs.promises.access(caminho, fs.constants.R_OK);
    } catch (_) {
        throw erro.notFound('O ficheiro já não está disponível.');
    }
    return { caminho, nome: anexo.nome_ficheiro, tipoMime: anexo.tipo_mime, tamanho: anexo.tamanho_bytes };
}

/** Quem carregou o ficheiro (ou um administrador do grupo/canal) pode removê-lo. */
async function eliminar(idAnexo, idUtilizador) {
    const { anexo, ctx } = await obterAnexoVisivel(idAnexo, idUtilizador);
    if (anexo.id_carregador !== idUtilizador && !ctx.eAdmin) {
        throw erro.forbidden('Só quem carregou o ficheiro ou um administrador o pode remover.');
    }

    let mensagemEliminada = false;
    await pool.withTransaction(async (conn) => {
        await anexoModel.eliminar(idAnexo, conn);
        const restantes = await anexoModel.listarPorMensagens([anexo.id_mensagem], conn);
        const msg = await mensagemModel.obterBasico(anexo.id_mensagem, conn);

        if (!restantes.length && !msg.conteudo) {
            // a mensagem só existia por causa deste ficheiro: fica sem nada, por isso é eliminada
            await mensagemModel.eliminar(anexo.id_mensagem, conn);
            mensagemEliminada = true;
        } else {
            await mensagemModel.atualizarTipo(anexo.id_mensagem, calcularTipoMensagem(msg.conteudo, restantes), conn);
        }
    });
    await apagarCaminhos([anexo.caminho_ficheiro]);

    return { eliminado: idAnexo, mensagem_eliminada: mensagemEliminada };
}

module.exports = { verificarPodeAnexar, adicionar, descarregar, eliminar, MAX_ANEXOS_POR_MENSAGEM };