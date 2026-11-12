const pool = require('../config/database');
const iaClient = require('./iaclient');
const notificacaoService = require('./notificacaoservice');
const projetoModel = require('../models/projeto');
const conversaIaModel = require('../models/conversaia');
const mensagemIaModel = require('../models/mensagemia');
const reuniaoModel = require('../models/reuniao');
const participanteReuniaoModel = require('../models/participantereuniao');
const resumoModel = require('../models/resumoreuniao');
const decisaoModel = require('../models/decisaoreuniao');
const sugestaoModel = require('../models/sugestaoia');
const organizacaoModel = require('../models/sugestaoorganizacao');
const { HttpError, erro } = require('../utils/httpError');

// ---------------------------------------------------------------------------
// Regras gerais
//  - Só circulam para o serviço de IA nomes e textos necessários (nunca emails, telefones ou passwords).
//  - Quem não tem acesso a um projeto/reunião recebe 404 (não se revela que existe).
//  - O que a IA devolve é sempre uma PROPOSTA: decisões ficam "pendentes" e sugestões "pendentes"
//    até uma pessoa as confirmar. Aceitar uma sugestão NÃO altera as tarefas (pertencem a outro módulo).
// ---------------------------------------------------------------------------

const TIPOS_SUGESTAO = ['melhoria', 'ajuste', 'organizacao', 'prioridade'];
const PRIORIDADES = ['baixa', 'media', 'alta', 'urgente'];
const MAX_HISTORICO = 10;

const corte = (texto, max) => (texto === null || texto === undefined ? null : String(texto).slice(0, max));
const paraIso = (data) => (data ? String(data).replace(' ', 'T') : null);
const normalizar = (nome) => String(nome || '').trim().toLowerCase();

// Cada chamada à IA custa tempo (e, com um modelo real, dinheiro): limite por utilizador
const USOS_POR_MINUTO = 10;
const usos = new Map();
function limitarUso(idUtilizador) {
    const agora = Date.now();
    const recentes = (usos.get(idUtilizador) || []).filter((t) => agora - t < 60_000);
    if (recentes.length >= USOS_POR_MINUTO) {
        throw new HttpError(429, 'Demasiados pedidos à IA. Tente novamente dentro de instantes.');
    }
    recentes.push(agora);
    usos.set(idUtilizador, recentes);
}

async function exigirProjeto(idProjeto, idUtilizador) {
    const projeto = await projetoModel.obterPorId(idProjeto);
    if (!projeto || !(await projetoModel.ehMembro(idProjeto, idUtilizador))) throw erro.notFound('Projeto não encontrado.');
    return projeto;
}

async function exigirParticipante(idReuniao, idUtilizador, mensagem = 'Reunião não encontrada.') {
    const reuniao = await reuniaoModel.obterPorId(idReuniao);
    const participante = reuniao && (await participanteReuniaoModel.obter(idReuniao, idUtilizador));
    if (!reuniao || !participante) throw erro.notFound(mensagem);
    return reuniao;
}

const paraTarefaContexto = (t) => ({
    id_tarefa: t.id_tarefa,
    titulo: corte(t.titulo, 200),
    descricao: corte(t.descricao, 2000),
    prioridade: t.prioridade,
    estado: t.estado,
    prazo: t.prazo || null,
    responsaveis: t.responsaveis.slice(0, 20)
});

// ---------------------------------------------------------------------------
// Chat com a IA
// ---------------------------------------------------------------------------

async function criarConversa(idUtilizador, idProjeto) {
    if (idProjeto) await exigirProjeto(idProjeto, idUtilizador);
    const id = await conversaIaModel.criar({ idUtilizador, idProjeto: idProjeto || null });
    return conversaIaModel.obterPorId(id);
}

const listarConversas = (idUtilizador) => conversaIaModel.listarDoUtilizador(idUtilizador);

/** As conversas com a IA são privadas: só o dono as vê. */
async function exigirConversaPropria(idConversaIa, idUtilizador) {
    const conversa = await conversaIaModel.obterPorId(idConversaIa);
    if (!conversa || conversa.id_utilizador !== idUtilizador) throw erro.notFound('Conversa com a IA não encontrada.');
    return conversa;
}

async function listarMensagens(idConversaIa, idUtilizador, paginacao) {
    await exigirConversaPropria(idConversaIa, idUtilizador);
    return mensagemIaModel.listarPorConversa(idConversaIa, paginacao);
}

/** Contexto para o chat: o projeto da conversa (se o utilizador ainda lá pertencer) e as suas reuniões resumidas. */
async function montarContextoChat(conversa, idUtilizador) {
    const contexto = { projeto: null, tarefas: [], reunioes: [] };

    if (conversa.id_projeto && (await projetoModel.ehMembro(conversa.id_projeto, idUtilizador))) {
        const projeto = await projetoModel.obterPorId(conversa.id_projeto);
        if (projeto) {
            contexto.projeto = { nome: corte(projeto.nome, 150), descricao: corte(projeto.descricao, 2000) };
            contexto.tarefas = (await projetoModel.listarTarefasParaIA(conversa.id_projeto)).map(paraTarefaContexto);
        }
    }

    const reunioes = await resumoModel.listarRecentesDoUtilizador(idUtilizador, 5);
    if (reunioes.length) {
        const decisoes = await decisaoModel.listarDescricoesPorReunioes(reunioes.map((r) => r.id_reuniao));
        contexto.reunioes = reunioes.map((r) => ({
            titulo: corte(r.titulo, 150),
            resumo: corte(r.resumo, 5000),
            decisoes: decisoes.filter((d) => d.id_reuniao === r.id_reuniao).slice(0, 30).map((d) => d.descricao)
        }));
    }
    return contexto;
}

async function perguntar(idConversaIa, idUtilizador, pergunta) {
    const conversa = await exigirConversaPropria(idConversaIa, idUtilizador);
    limitarUso(idUtilizador);

    const historico = (await mensagemIaModel.ultimas(idConversaIa, MAX_HISTORICO))
        .map((m) => ({ tipo: m.tipo, conteudo: corte(m.conteudo, 8000) }));
    const contexto = await montarContextoChat(conversa, idUtilizador);

    const r = await iaClient.chat({ pergunta, historico, contexto });
    if (typeof r.resposta !== 'string' || !r.resposta.trim()) {
        throw new HttpError(502, 'O serviço de IA devolveu uma resposta inválida.');
    }

    // Só se guarda a conversa se a IA respondeu: pergunta e resposta ficam juntas ou nenhuma
    const { idPergunta, idResposta } = await pool.withTransaction(async (conn) => ({
        idPergunta: await mensagemIaModel.criar({ idConversaIa, tipo: 'pergunta', conteudo: pergunta }, conn),
        idResposta: await mensagemIaModel.criar({ idConversaIa, tipo: 'resposta', conteudo: r.resposta.trim() }, conn)
    }));

    return {
        pergunta: { id_mensagem_ia: idPergunta, conteudo: pergunta },
        resposta: { id_mensagem_ia: idResposta, conteudo: r.resposta.trim() },
        modelo: r.modelo || null
    };
}

// ---------------------------------------------------------------------------
// Resumos e decisões de reuniões
// ---------------------------------------------------------------------------

async function gerarResumo(idReuniao, utilizador, texto) {
    const reuniao = await exigirParticipante(idReuniao, utilizador.id);
    if (reuniao.id_criador !== utilizador.id) throw erro.forbidden('Apenas o organizador pode gerar o resumo.');
    if (!['em_curso', 'concluida'].includes(reuniao.estado)) {
        throw erro.conflict(`A reunião está "${reuniao.estado}": só se resume uma reunião em curso ou concluída.`);
    }
    limitarUso(utilizador.id);

    const participantes = await participanteReuniaoModel.listar(idReuniao);
    const r = await iaClient.resumirReuniao({
        reuniao: {
            titulo: corte(reuniao.titulo, 150),
            descricao: corte(reuniao.descricao, 2000),
            data_inicio: paraIso(reuniao.data_inicio),
            participantes: participantes.map((p) => p.nome).slice(0, 50)
        },
        texto
    });
    if (typeof r.resumo !== 'string' || !r.resumo.trim()) {
        throw new HttpError(502, 'O serviço de IA devolveu uma resposta inválida.');
    }

    // A IA sugere um responsável pelo NOME; só se aceita se for mesmo um participante da reunião
    const idPorNome = new Map(participantes.map((p) => [normalizar(p.nome), p.id_utilizador]));
    const propostas = (Array.isArray(r.decisoes) ? r.decisoes : [])
        .filter((d) => d && typeof d.descricao === 'string' && d.descricao.trim())
        .slice(0, 30);

    const { idResumo, idsDecisoes } = await pool.withTransaction(async (conn) => {
        const id = await resumoModel.criar({ idReuniao, conteudo: r.resumo.trim(), modelo: corte(r.modelo, 100) }, conn);
        const ids = [];
        for (const d of propostas) {
            ids.push(await decisaoModel.criar({
                idReuniao,
                descricao: d.descricao.trim(),
                idResponsavel: idPorNome.get(normalizar(d.responsavel_sugerido)) ?? null
            }, conn));
        }
        return { idResumo: id, idsDecisoes: ids };
    });

    // Avisa os outros participantes (melhor esforço: o resumo já foi guardado)
    for (const p of participantes) {
        if (p.id_utilizador === utilizador.id) continue;
        notificacaoService.criar({
            idUtilizador: p.id_utilizador,
            tipo: 'reuniao',
            titulo: 'Resumo da reunião disponível',
            mensagem: `Foi gerado o resumo da reunião "${reuniao.titulo}".`,
            entidadeTipo: 'reuniao',
            entidadeId: idReuniao
        }).catch((e) => console.error('[ia] falha ao notificar o resumo:', e.message));
    }

    const novas = new Set(idsDecisoes);
    return {
        resumo: await resumoModel.obterPorId(idResumo),
        decisoes: (await decisaoModel.listarPorReuniao(idReuniao)).filter((d) => novas.has(d.id_decisao))
    };
}

/** Qualquer participante da reunião vê os resumos e as decisões. */
async function obterResumos(idReuniao, idUtilizador) {
    await exigirParticipante(idReuniao, idUtilizador);
    return {
        resumos: await resumoModel.listarPorReuniao(idReuniao),
        decisoes: await decisaoModel.listarPorReuniao(idReuniao)
    };
}

/** Só o organizador confirma ou rejeita as decisões propostas pela IA. */
async function validarDecisao(idDecisao, idUtilizador, estado) {
    const decisao = await decisaoModel.obterPorId(idDecisao);
    if (!decisao) throw erro.notFound('Decisão não encontrada.');
    const reuniao = await exigirParticipante(decisao.id_reuniao, idUtilizador, 'Decisão não encontrada.');
    if (reuniao.id_criador !== idUtilizador) throw erro.forbidden('Apenas o organizador pode validar decisões.');

    await decisaoModel.atualizarValidacao(idDecisao, estado);
    return decisaoModel.obterPorId(idDecisao);
}

// ---------------------------------------------------------------------------
// Sugestões para o projeto (melhorias/ajustes + organização e prioridade das tarefas)
// ---------------------------------------------------------------------------

const dataValida = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);

async function gerarSugestoes(idProjeto, utilizador) {
    const projeto = await exigirProjeto(idProjeto, utilizador.id);
    const tarefas = await projetoModel.listarTarefasParaIA(idProjeto);
    if (!tarefas.length) throw erro.badRequest('O projeto não tem tarefas para analisar.');
    limitarUso(utilizador.id);

    const r = await iaClient.sugerir({
        projeto: { nome: corte(projeto.nome, 150), descricao: corte(projeto.descricao, 2000) },
        tarefas: tarefas.map(paraTarefaContexto)
    });

    // Desconfiar do que vem da IA: só tipos válidos e só tarefas que pertencem mesmo a este projeto
    const porId = new Map(tarefas.map((t) => [t.id_tarefa, t]));
    const gerais = (Array.isArray(r.sugestoes) ? r.sugestoes : [])
        .filter((s) => s && TIPOS_SUGESTAO.includes(s.tipo) && typeof s.descricao === 'string' && s.descricao.trim())
        .slice(0, 20);
    const organizacao = (Array.isArray(r.organizacao) ? r.organizacao : [])
        .filter((o) => o && porId.has(o.id_tarefa))
        .map((o) => ({
            tarefa: porId.get(o.id_tarefa),
            prioridade: PRIORIDADES.includes(o.prioridade_sugerida) ? o.prioridade_sugerida : null,
            prazo: dataValida(o.prazo_sugerido) ? o.prazo_sugerido : null,
            justificacao: o.justificacao
        }))
        .filter((o) => o.prioridade || o.prazo)
        .slice(0, 50);

    const { idsGerais, idsOrganizacao } = await pool.withTransaction(async (conn) => {
        const g = [];
        for (const s of gerais) {
            g.push(await sugestaoModel.criar({
                idProjeto, idUtilizador: utilizador.id, tipo: s.tipo,
                descricao: s.descricao.trim(), justificacao: typeof s.justificacao === 'string' ? s.justificacao : null
            }, conn));
        }
        const o = [];
        for (const x of organizacao) {
            o.push(await organizacaoModel.criar({
                idTarefa: x.tarefa.id_tarefa,
                prioridadeAtual: x.tarefa.prioridade,
                prioridadeSugerida: x.prioridade,
                prazoAtual: x.tarefa.prazo || null,
                prazoSugerido: x.prazo,
                justificacao: typeof x.justificacao === 'string' ? x.justificacao : null
            }, conn));
        }
        return { idsGerais: g, idsOrganizacao: o };
    });

    const novasGerais = new Set(idsGerais);
    const novasOrganizacao = new Set(idsOrganizacao);
    return {
        sugestoes: (await sugestaoModel.listarPorProjeto(idProjeto)).filter((s) => novasGerais.has(s.id_sugestao)),
        organizacao: (await organizacaoModel.listarPorProjeto(idProjeto)).filter((s) => novasOrganizacao.has(s.id_sugestao)),
        modelo: r.modelo || null
    };
}

async function listarSugestoes(idProjeto, idUtilizador, { estado } = {}) {
    await exigirProjeto(idProjeto, idUtilizador);
    return {
        sugestoes: await sugestaoModel.listarPorProjeto(idProjeto, { estado }),
        organizacao: await organizacaoModel.listarPorProjeto(idProjeto, { estado })
    };
}

/** Aceitar ou rejeitar é uma marca de decisão da equipa: não altera as tarefas. */
async function responderSugestao(idSugestao, idUtilizador, estado) {
    const sugestao = await sugestaoModel.obterPorId(idSugestao);
    if (!sugestao || !sugestao.id_projeto || !(await projetoModel.ehMembro(sugestao.id_projeto, idUtilizador))) {
        throw erro.notFound('Sugestão não encontrada.');
    }
    await sugestaoModel.atualizarEstado(idSugestao, estado);
    return sugestaoModel.obterPorId(idSugestao);
}

async function responderSugestaoOrganizacao(idSugestao, idUtilizador, estado) {
    const sugestao = await organizacaoModel.obterPorId(idSugestao);
    if (!sugestao || !(await projetoModel.ehMembro(sugestao.id_projeto, idUtilizador))) {
        throw erro.notFound('Sugestão não encontrada.');
    }
    await organizacaoModel.atualizarEstado(idSugestao, estado);
    return organizacaoModel.obterPorId(idSugestao);
}

module.exports = {
    criarConversa, listarConversas, listarMensagens, perguntar,
    gerarResumo, obterResumos, validarDecisao,
    gerarSugestoes, listarSugestoes, responderSugestao, responderSugestaoOrganizacao
};