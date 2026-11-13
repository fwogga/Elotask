const pool = require('../config/database');
const canalModel = require('../models/canal');
const membroCanalModel = require('../models/membrocanal');
const utilizadorModel = require('../models/utilizador');
const notificacaoService = require('./notificacaoservice');
const { erro } = require('../utils/httpError');

// ---------------------------------------------------------------------------
// Auxiliares
// ---------------------------------------------------------------------------

/** Notificações em melhor esforço: se falharem, a operação principal já foi concluída. */
async function notificar(idsUtilizadores, idCanal, titulo, mensagem) {
    for (const idUtilizador of idsUtilizadores) {
        try {
            await notificacaoService.criar({
                idUtilizador, tipo: 'canal', titulo, mensagem, entidadeTipo: 'canal', entidadeId: idCanal
            });
        } catch (e) {
            console.error('[canais] falha ao notificar utilizador', idUtilizador, e.message);
        }
    }
}

/** (id_equipa, nome) é UNIQUE na BD: traduz o erro para uma mensagem útil. */
function traduzirDuplicado(e) {
    if (e && e.code === 'ER_DUP_ENTRY') return erro.conflict('Já existe um canal com este nome nesta equipa.');
    return e;
}

async function exigirMembroDaEquipa(idEquipa, idUtilizador) {
    if (!(await canalModel.equipaExiste(idEquipa))) throw erro.notFound('Equipa não encontrada.');
    if (!(await canalModel.ehMembroEquipa(idEquipa, idUtilizador))) throw erro.forbidden('Não pertence a esta equipa.');
}

/**
 * Carrega o canal e a relação do utilizador com ele.
 * - Canal privado: quem não é membro recebe 404 (não revela que existe).
 * - Canal público: qualquer membro da equipa o pode ver (e entrar).
 */
async function carregarCanal(idCanal, idUtilizador) {
    const canal = await canalModel.obterPorId(idCanal);
    if (!canal) throw erro.notFound('Canal não encontrado.');

    const membro = await membroCanalModel.obter(idCanal, idUtilizador);
    const daEquipa = membro ? true : await canalModel.ehMembroEquipa(canal.id_equipa, idUtilizador);
    if (!membro && !(canal.tipo === 'publico' && daEquipa)) throw erro.notFound('Canal não encontrado.');

    return { canal, membro, daEquipa, eAdmin: !!membro && membro.papel === 'administrador' };
}

async function exigirMembro(idCanal, idUtilizador) {
    const ctx = await carregarCanal(idCanal, idUtilizador);
    if (!ctx.membro) throw erro.forbidden('Não é membro deste canal.');
    return ctx;
}

async function exigirAdminDoCanal(idCanal, idUtilizador) {
    const ctx = await exigirMembro(idCanal, idUtilizador);
    if (!ctx.eAdmin) throw erro.forbidden('Apenas administradores do canal podem fazer isto.');
    return ctx;
}

/** Os ids têm de ser utilizadores ativos E membros da equipa do canal. */
async function validarCandidatos(idEquipa, ids) {
    const ativos = new Set((await utilizadorModel.listarAtivosPorIds(ids)).map((u) => u.id_utilizador));
    const naEquipa = new Set(await canalModel.filtrarMembrosEquipa(idEquipa, ids));
    const invalidos = ids.filter((id) => !ativos.has(id) || !naEquipa.has(id));
    if (invalidos.length) {
        throw erro.badRequest('Só é possível adicionar utilizadores ativos que pertençam à equipa.', { ids_invalidos: invalidos });
    }
}

// ---------------------------------------------------------------------------
// Consulta
// ---------------------------------------------------------------------------

async function listarMeus(idUtilizador) {
    return canalModel.listarDoUtilizador(idUtilizador);
}

async function listarDaEquipa(idEquipa, idUtilizador) {
    await exigirMembroDaEquipa(idEquipa, idUtilizador);
    return canalModel.listarPorEquipa(idEquipa, idUtilizador);
}

async function obterDetalhe(idCanal, idUtilizador) {
    const { canal, membro } = await carregarCanal(idCanal, idUtilizador);
    const detalhe = { ...canal, e_membro: !!membro, papel_utilizador: membro ? membro.papel : null };
    if (membro) detalhe.membros = await membroCanalModel.listar(idCanal); // a lista só é visível a membros
    return detalhe;
}

async function listarMembros(idCanal, idUtilizador) {
    await exigirMembro(idCanal, idUtilizador);
    return membroCanalModel.listar(idCanal);
}

// ---------------------------------------------------------------------------
// Criação e gestão do canal
// ---------------------------------------------------------------------------

async function criar(quem, idEquipa, { nome, descricao, tipo, participantes }) {
    await exigirMembroDaEquipa(idEquipa, quem.id);
    const outros = participantes.filter((id) => id !== quem.id);
    await validarCandidatos(idEquipa, outros);

    let idCanal;
    try {
        idCanal = await pool.withTransaction(async (conn) => {
            const id = await canalModel.criar({ idEquipa, nome, descricao, tipo, idCriador: quem.id }, conn);
            await membroCanalModel.adicionar(id, quem.id, 'administrador', conn);
            for (const idOutro of outros) await membroCanalModel.adicionar(id, idOutro, 'membro', conn);
            return id;
        });
    } catch (e) {
        throw traduzirDuplicado(e);
    }

    notificar(outros, idCanal, 'Adicionado a um canal', `${quem.nome} adicionou-o(a) ao canal "${nome}".`);
    return obterDetalhe(idCanal, quem.id);
}

async function atualizar(idCanal, idUtilizador, alteracoes) {
    await exigirAdminDoCanal(idCanal, idUtilizador);
    try {
        await canalModel.atualizar(idCanal, alteracoes);
    } catch (e) {
        throw traduzirDuplicado(e);
    }
    return obterDetalhe(idCanal, idUtilizador);
}

/** ATENÇÃO: a BD apaga em cascata todas as mensagens do canal (ON DELETE CASCADE). */
async function eliminar(idCanal, idUtilizador) {
    await exigirAdminDoCanal(idCanal, idUtilizador);
    await canalModel.eliminar(idCanal);
    return { eliminado: idCanal };
}

// ---------------------------------------------------------------------------
// Membros
// ---------------------------------------------------------------------------

/**
 * Qualquer membro da equipa pode entrar num canal PÚBLICO.
 * Canais privados só por convite: para quem não é membro devolvem 404 (ver carregarCanal).
 */
async function entrar(idCanal, idUtilizador) {
    const ctx = await carregarCanal(idCanal, idUtilizador);
    if (ctx.membro) return { entrou: false, canal: await obterDetalhe(idCanal, idUtilizador) }; // já era membro

    await membroCanalModel.adicionar(idCanal, idUtilizador, 'membro');
    return { entrou: true, canal: await obterDetalhe(idCanal, idUtilizador) };
}

async function adicionarMembros(idCanal, quem, ids) {
    const { canal } = await exigirAdminDoCanal(idCanal, quem.id);
    await validarCandidatos(canal.id_equipa, ids);

    const adicionados = [];
    for (const id of ids) {
        if (await membroCanalModel.adicionar(idCanal, id, 'membro')) adicionados.push(id);
    }
    notificar(adicionados, idCanal, 'Adicionado a um canal', `${quem.nome} adicionou-o(a) ao canal "${canal.nome}".`);
    return { adicionados, membros: await membroCanalModel.listar(idCanal) };
}

/**
 * Remove um membro (ou o próprio sai). O administrador remove outros; qualquer membro pode sair.
 * Se o último administrador sair, o membro mais antigo é promovido.
 * O último membro não pode sair (o canal ficaria sem ninguém): deve eliminar o canal.
 */
async function removerMembro(idCanal, quem, idAlvo) {
    const { canal, membro, eAdmin } = await exigirMembro(idCanal, quem.id);
    const saiu = quem.id === idAlvo;
    if (!saiu && !eAdmin) throw erro.forbidden('Apenas administradores podem remover outros membros.');

    const alvo = saiu ? membro : await membroCanalModel.obter(idCanal, idAlvo);
    if (!alvo) throw erro.notFound('O utilizador não é membro deste canal.');

    await pool.withTransaction(async (conn) => {
        if ((await membroCanalModel.listarIds(idCanal, conn)).length === 1) {
            throw erro.conflict('É o último membro do canal: elimine o canal em vez de sair.');
        }
        await membroCanalModel.remover(idCanal, idAlvo, conn);

        if (alvo.papel === 'administrador' && (await membroCanalModel.contarAdministradores(idCanal, conn)) === 0) {
            const [maisAntigo] = await membroCanalModel.listar(idCanal, conn);
            await membroCanalModel.atualizarPapel(idCanal, maisAntigo.id_utilizador, 'administrador', conn);
        }
    });

    if (!saiu) notificar([idAlvo], idCanal, 'Removido de um canal', `Foi removido(a) do canal "${canal.nome}" por ${quem.nome}.`);
    return { removido: idAlvo };
}

async function alterarPapel(idCanal, idUtilizador, idAlvo, papel) {
    await exigirAdminDoCanal(idCanal, idUtilizador);
    if (!(await membroCanalModel.obter(idCanal, idAlvo))) throw erro.notFound('O utilizador não é membro deste canal.');

    await pool.withTransaction(async (conn) => {
        await membroCanalModel.atualizarPapel(idCanal, idAlvo, papel, conn);
        if ((await membroCanalModel.contarAdministradores(idCanal, conn)) === 0) {
            throw erro.badRequest('O canal tem de ter pelo menos um administrador.'); // faz rollback
        }
    });
    return membroCanalModel.listar(idCanal);
}

module.exports = {
    listarMeus, listarDaEquipa, obterDetalhe, listarMembros, criar, atualizar, eliminar,
    entrar, adicionarMembros, removerMembro, alterarPapel
};