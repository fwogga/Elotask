const pool = require('../config/database');
const conversaModel = require('../models/conversa');
const membroModel = require('../models/participanteconversa');
const utilizadorModel = require('../models/utilizador');
const { erro } = require('../utils/httpError');

/** Devolve o participante ativo ou lança 403 (quem não pertence à conversa não a vê). */
async function exigirMembro(idConversa, idUtilizador, db) {
    const membro = await membroModel.obterAtivo(idConversa, idUtilizador, db);
    if (!membro) throw erro.forbidden('Não pertence a esta conversa.');
    return membro;
}

async function exigirConversa(idConversa, db) {
    const conversa = await conversaModel.obterConversaPorId(idConversa, db);
    if (!conversa) throw erro.notFound('Conversa não encontrada.');
    return conversa;
}

async function exigirAdminDoGrupo(idConversa, idUtilizador, db) {
    const conversa = await exigirConversa(idConversa, db);
    if (conversa.tipo !== 'grupo') throw erro.badRequest('Esta operação só é válida para conversas de grupo.');
    const membro = await exigirMembro(idConversa, idUtilizador, db);
    if (membro.papel !== 'administrador') throw erro.forbidden('Apenas administradores do grupo podem fazer isto.');
    return conversa;
}

/** Garante que todos os ids existem e estão ativos. */
async function validarUtilizadores(ids, db) {
    const encontrados = await utilizadorModel.listarAtivosPorIds(ids, db);
    const idsOk = new Set(encontrados.map((u) => u.id_utilizador));
    const invalidos = ids.filter((id) => !idsOk.has(id));
    if (invalidos.length) throw erro.badRequest('Utilizadores inexistentes ou inativos.', { ids_invalidos: invalidos });
}

async function listarDoUtilizador(idUtilizador) {
    return conversaModel.listarConversasPorUtilizador(idUtilizador);
}

async function obterDetalhe(idConversa, idUtilizador) {
    const conversa = await exigirConversa(idConversa);
    await exigirMembro(idConversa, idUtilizador);
    const membros = await conversaModel.listarMembrosDaConversa(idConversa);
    return { ...conversa, membros };
}

async function listarMembros(idConversa, idUtilizador) {
    await exigirConversa(idConversa);
    await exigirMembro(idConversa, idUtilizador);
    return conversaModel.listarMembrosDaConversa(idConversa);
}

/**
 * Cria uma conversa individual ou de grupo.
 * - individual: exatamente 1 outro participante; se já existir conversa entre os dois, é reutilizada.
 * - grupo: nome obrigatório e pelo menos 1 outro participante; o criador fica como administrador.
 * Devolve { conversa, criada }.
 */
async function criar(idCriador, { tipo, nome, participantes }) {
    const outros = participantes.filter((id) => id !== idCriador);

    if (tipo === 'individual') {
        if (outros.length !== 1) {
            throw erro.badRequest('Uma conversa individual requer exatamente um outro participante.');
        }
        if (nome) throw erro.badRequest('Conversas individuais não têm nome.');
    } else {
        if (!nome) throw erro.badRequest('O nome do grupo é obrigatório.');
        if (outros.length < 1) throw erro.badRequest('Um grupo requer pelo menos um participante além do criador.');
    }

    await validarUtilizadores(outros);

    const idNovo = await pool.withTransaction(async (conn) => {
        if (tipo === 'individual') {
            const existente = await conversaModel.encontrarIndividualEntre(idCriador, outros[0], conn);
            if (existente) return { id: existente, criada: false };
        }
        const id = await conversaModel.criar({ nome: tipo === 'grupo' ? nome : null, tipo, idCriador }, conn);
        await membroModel.adicionar(id, idCriador, tipo === 'grupo' ? 'administrador' : 'membro', conn);
        for (const idOutro of outros) await membroModel.adicionar(id, idOutro, 'membro', conn);
        return { id, criada: true };
    });

    const conversa = await obterDetalhe(idNovo.id, idCriador);
    return { conversa, criada: idNovo.criada };
}

async function atualizar(idConversa, idUtilizador, { nome, estado }) {
    const conversa = await exigirConversa(idConversa);
    if (conversa.tipo === 'grupo') {
        await exigirAdminDoGrupo(idConversa, idUtilizador);
    } else {
        // individual: não tem nome, mas qualquer participante a pode arquivar
        await exigirMembro(idConversa, idUtilizador);
        if (nome !== undefined) throw erro.badRequest('Conversas individuais não têm nome.');
    }
    await conversaModel.atualizar(idConversa, { nome, estado });
    return obterDetalhe(idConversa, idUtilizador);
}

async function adicionarMembros(idConversa, idUtilizador, ids) {
    await exigirAdminDoGrupo(idConversa, idUtilizador);
    await validarUtilizadores(ids);
    const adicionados = [];
    await pool.withTransaction(async (conn) => {
        for (const id of ids) {
            if (await membroModel.obterAtivo(idConversa, id, conn)) continue; // já é membro
            await membroModel.adicionar(idConversa, id, 'membro', conn);
            adicionados.push(id);
        }
    });
    return { adicionados, membros: await conversaModel.listarMembrosDaConversa(idConversa) };
}

/**
 * Remove um participante (ou o próprio sai da conversa).
 * Apenas grupos; um administrador remove outros, qualquer membro pode sair.
 * Se o último administrador sair, o membro mais antigo é promovido.
 */
async function removerMembro(idConversa, idQuemPede, idAlvo) {
    const conversa = await exigirConversa(idConversa);
    if (conversa.tipo !== 'grupo') throw erro.badRequest('Não é possível remover participantes de uma conversa individual.');

    const quem = await exigirMembro(idConversa, idQuemPede);
    const saiu = idQuemPede === idAlvo;
    if (!saiu && quem.papel !== 'administrador') throw erro.forbidden('Apenas administradores podem remover outros participantes.');

    const alvo = saiu ? quem : await membroModel.obterAtivo(idConversa, idAlvo);
    if (!alvo) throw erro.notFound('O utilizador não é participante desta conversa.');

    return pool.withTransaction(async (conn) => {
        await membroModel.remover(idConversa, idAlvo, conn);
        const restantes = await membroModel.listarIdsAtivos(idConversa, conn);

        if (restantes.length === 0) {
            await conversaModel.atualizar(idConversa, { estado: 'inativa' }, conn);
            return { removido: idAlvo, conversa_encerrada: true };
        }
        if (alvo.papel === 'administrador' && (await membroModel.contarAdministradores(idConversa, conn)) === 0) {
            const [maisAntigo] = (await conversaModel.listarMembrosDaConversa(idConversa, conn));
            await membroModel.atualizarPapel(idConversa, maisAntigo.id_utilizador, 'administrador', conn);
        }
        return { removido: idAlvo, conversa_encerrada: false };
    });
}

async function alterarPapel(idConversa, idQuemPede, idAlvo, papel) {
    await exigirAdminDoGrupo(idConversa, idQuemPede);
    if (!(await membroModel.obterAtivo(idConversa, idAlvo))) throw erro.notFound('O utilizador não é participante desta conversa.');

    await pool.withTransaction(async (conn) => {
        await membroModel.atualizarPapel(idConversa, idAlvo, papel, conn);
        if ((await membroModel.contarAdministradores(idConversa, conn)) === 0) {
            throw erro.badRequest('O grupo tem de ter pelo menos um administrador.');
        }
    });
    return conversaModel.listarMembrosDaConversa(idConversa);
}

module.exports = {
    exigirMembro, listarDoUtilizador, obterDetalhe, listarMembros, criar, atualizar,
    adicionarMembros, removerMembro, alterarPapel
};