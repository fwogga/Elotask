const EventEmitter = require('events');
const pool = require('../config/database');
const env = require('../config/env');
const chamadaModel = require('../models/chamada');
const participanteModel = require('../models/participantechamada');
const sinalizacaoModel = require('../models/sinalizacao');
const conversaModel = require('../models/conversa');
const membroConversaModel = require('../models/participanteconversa');
const reuniaoModel = require('../models/reuniao');
const participanteReuniaoModel = require('../models/participantereuniao');
const notificacaoService = require('./notificacaoservice');
const { erro } = require('../utils/httpError');

// Quanto tempo uma chamada pode "tocar" sem ninguém atender antes de falhar
const TIMEOUT_TOCAR_S = 60;
// WebRTC em malha (cada participante liga-se a todos os outros) só aguenta poucos participantes.
// Para chamadas maiores seria preciso um servidor SFU.
const MAX_EM_CHAMADA = 8;
const TIPOS_SINALIZACAO = ['oferta', 'resposta', 'candidato_ice'];
const MAX_SINALIZACAO_BYTES = 64 * 1024;

/**
 * Eventos para o módulo de sockets subscrever (sem acoplar os dois):
 *   'chamada:iniciada'    { chamada, convidados }
 *   'chamada:entrou'      { idChamada, idUtilizador }
 *   'chamada:saiu'        { idChamada, idUtilizador }
 *   'chamada:recusada'    { idChamada, idUtilizador }
 *   'chamada:terminada'   { idChamada, estado, motivo }
 */
const eventos = new EventEmitter();
function emitir(nome, payload) {
    try {
        eventos.emit(nome, payload);
    } catch (e) {
        console.error(`[chamadas] erro num subscritor de "${nome}":`, e.message);
    }
}

/** Notificações em melhor esforço (a operação principal já foi concluída). */
async function notificar(ids, idChamada, titulo, mensagem) {
    for (const idUtilizador of ids) {
        try {
            await notificacaoService.criar({
                idUtilizador, tipo: 'chamada', titulo, mensagem, entidadeTipo: 'chamada', entidadeId: idChamada
            });
        } catch (e) {
            console.error('[chamadas] falha ao notificar utilizador', idUtilizador, e.message);
        }
    }
}

const ativa = (c) => c.estado === 'iniciada' || c.estado === 'em_curso';
const dentroDaChamada = (p) => p.estado_participacao === 'aceite' && !p.data_saida;

// ---------------------------------------------------------------------------
// Fim da chamada (todas as formas de terminar passam por aqui)
// ---------------------------------------------------------------------------

/**
 * Termina a chamada de forma atómica (só a primeira chamada tem efeito).
 * estado: 'terminada' | 'cancelada' | 'falhada'. Devolve true se foi esta chamada que a terminou.
 */
async function encerrar(idChamada, estado, motivo) {
    let convidadosSemResposta = [];
    const terminou = await pool.withTransaction(async (conn) => {
        if (!(await chamadaModel.encerrar(idChamada, estado, motivo, conn))) return false;
        convidadosSemResposta = await participanteModel.listarIdsPorEstado(idChamada, 'convidado', conn);
        await participanteModel.encerrarTodos(idChamada, conn);
        return true;
    });
    if (!terminou) return false;

    // Quem nunca chegou a atender fica com um aviso de chamada perdida
    if ((estado === 'cancelada' || estado === 'falhada') && convidadosSemResposta.length) {
        const c = await chamadaModel.obterPorId(idChamada);
        notificar(convidadosSemResposta, idChamada, 'Chamada perdida',
            `Chamada de ${c.nome_iniciador} (${c.tipo_chamada === 'video' ? 'vídeo' : 'voz'}) sem resposta.`);
    }
    emitir('chamada:terminada', { idChamada, estado, motivo });
    return true;
}

/**
 * Carrega a chamada e, se estava a tocar há demasiado tempo sem ninguém atender, marca-a como falhada.
 * (Verificação "preguiçosa": evita depender de um job em segundo plano.)
 */
async function carregar(idChamada) {
    let chamada = await chamadaModel.obterPorId(idChamada);
    if (chamada && chamada.estado === 'iniciada' && chamada.segundos_desde_inicio > TIMEOUT_TOCAR_S) {
        await encerrar(idChamada, 'falhada', 'sem_resposta');
        chamada = await chamadaModel.obterPorId(idChamada);
    }
    return chamada;
}

/** A chamada tem de existir e o utilizador tem de ter sido convidado/ser participante; senão, 404. */
async function carregarVisivel(idChamada, idUtilizador) {
    const chamada = await carregar(idChamada);
    const participante = chamada && (await participanteModel.obter(idChamada, idUtilizador));
    if (!chamada || !participante) throw erro.notFound('Chamada não encontrada.');
    return { chamada, participante };
}

function exigirAtiva(chamada) {
    if (!ativa(chamada)) throw erro.conflict('Esta chamada já terminou.');
}

/** O utilizador já está dentro de outra chamada? (apanha e fecha chamadas "penduradas" que já expiraram) */
async function estaOcupado(idUtilizador, excetoChamada = null) {
    for (const id of await chamadaModel.listarIdsEmChamada(idUtilizador)) {
        if (id === excetoChamada) continue;
        const c = await carregar(id);
        if (c && ativa(c)) return true;
    }
    return false;
}

async function detalhe(idChamada, idUtilizador) {
    const { chamada, participante } = await carregarVisivel(idChamada, idUtilizador);
    const { segundos_desde_inicio, ...publica } = chamada;
    return {
        ...publica,
        meu_estado: participante.estado_participacao,
        participantes: await participanteModel.listar(idChamada)
    };
}

// ---------------------------------------------------------------------------
// Consulta
// ---------------------------------------------------------------------------

async function listar(idUtilizador, filtros) {
    return chamadaModel.listarDoUtilizador(idUtilizador, filtros);
}

/** Chamadas a tocar para o utilizador ou em que já está dentro. */
async function listarAtivas(idUtilizador) {
    const resultado = [];
    for (const id of await chamadaModel.listarIdsAtivasDoUtilizador(idUtilizador)) {
        const c = await carregar(id); // pode expirar chamadas antigas
        if (c && ativa(c)) resultado.push(await detalhe(id, idUtilizador));
    }
    return resultado;
}

/** Servidores STUN/TURN que o frontend passa ao RTCPeerConnection. */
function configWebrtc() {
    const iceServers = [];
    if (env.webrtc.stunUrls.length) iceServers.push({ urls: env.webrtc.stunUrls });
    if (env.webrtc.turnUrl) {
        iceServers.push({
            urls: env.webrtc.turnUrl, username: env.webrtc.turnUsername, credential: env.webrtc.turnCredential
        });
    }
    return { iceServers, max_participantes: MAX_EM_CHAMADA };
}

// ---------------------------------------------------------------------------
// Ciclo de vida
// ---------------------------------------------------------------------------

/** Quem pode ser chamado a partir de uma conversa: os seus participantes ativos. */
async function convidadosDaConversa(idConversa, iniciador) {
    const conversa = await conversaModel.obterConversaPorId(idConversa);
    if (!conversa) throw erro.notFound('Conversa não encontrada.');
    if (!(await membroConversaModel.obterAtivo(idConversa, iniciador.id))) throw erro.forbidden('Não pertence a esta conversa.');
    if (conversa.estado !== 'ativa') throw erro.conflict('Esta conversa está arquivada ou inativa.');
    return membroConversaModel.listarIdsAtivos(idConversa);
}

/** Quem pode ser chamado a partir de uma reunião: os participantes que não recusaram o convite. */
async function convidadosDaReuniao(idReuniao, iniciador) {
    const reuniao = await reuniaoModel.obterPorId(idReuniao);
    const eu = reuniao && (await participanteReuniaoModel.obter(idReuniao, iniciador.id));
    if (!reuniao || !eu) throw erro.notFound('Reunião não encontrada.'); // quem não participa não a vê
    if (!['agendada', 'em_curso'].includes(reuniao.estado)) throw erro.conflict(`A reunião está "${reuniao.estado}".`);
    return (await participanteReuniaoModel.listar(idReuniao))
        .filter((p) => p.estado_convite !== 'recusado')
        .map((p) => p.id_utilizador);
}

/** Se já houver uma chamada ativa nesse contexto, a nova não pode começar (deve entrar na existente). */
async function exigirSemChamadaAtiva(coluna, valor) {
    const idExistente = await chamadaModel.obterIdAtiva(coluna, valor);
    if (!idExistente) return;
    const existente = await carregar(idExistente); // pode ter expirado entretanto
    if (existente && ativa(existente)) {
        throw erro.conflict('Já existe uma chamada ativa aqui: entre nessa chamada.', { id_chamada: idExistente });
    }
}

async function iniciar(iniciador, { tipoChamada, idConversa, idReuniao }) {
    if (!idConversa && !idReuniao) throw erro.badRequest('Indique id_conversa ou id_reuniao.');

    const ids = new Set();
    if (idConversa) (await convidadosDaConversa(idConversa, iniciador)).forEach((id) => ids.add(id));
    if (idReuniao) (await convidadosDaReuniao(idReuniao, iniciador)).forEach((id) => ids.add(id));
    ids.delete(iniciador.id);
    const convidados = [...ids];
    if (!convidados.length) throw erro.badRequest('Não há ninguém para chamar.');

    if (idConversa) await exigirSemChamadaAtiva('id_conversa', idConversa);
    if (idReuniao) await exigirSemChamadaAtiva('id_reuniao', idReuniao);
    if (await estaOcupado(iniciador.id)) throw erro.conflict('Já está numa chamada: termine-a antes de iniciar outra.');

    const idChamada = await pool.withTransaction(async (conn) => {
        const id = await chamadaModel.criar({ idConversa, idReuniao, idIniciador: iniciador.id, tipoChamada }, conn);
        await participanteModel.adicionar(id, iniciador.id, 'aceite', conn); // o iniciador já está dentro
        for (const idConvidado of convidados) await participanteModel.adicionar(id, idConvidado, 'convidado', conn);
        return id;
    });

    notificar(convidados, idChamada, 'Chamada recebida',
        `${iniciador.nome} está a ligar-lhe (${tipoChamada === 'video' ? 'vídeo' : 'voz'}).`);

    const resultado = await detalhe(idChamada, iniciador.id);
    emitir('chamada:iniciada', { chamada: resultado, convidados });
    return resultado;
}

/** Atender (ou voltar a entrar numa chamada em curso). */
async function entrar(idChamada, utilizador) {
    const { chamada, participante } = await carregarVisivel(idChamada, utilizador.id);
    exigirAtiva(chamada);
    if (dentroDaChamada(participante)) return detalhe(idChamada, utilizador.id); // já está dentro
    if (participante.estado_participacao === 'recusado') throw erro.conflict('Recusou esta chamada.');

    if (await estaOcupado(utilizador.id, idChamada)) throw erro.conflict('Já está noutra chamada.');
    if ((await participanteModel.contarEmChamada(idChamada)) >= MAX_EM_CHAMADA) {
        throw erro.conflict(`A chamada já tem o máximo de ${MAX_EM_CHAMADA} participantes.`);
    }

    await pool.withTransaction(async (conn) => {
        await participanteModel.entrar(idChamada, utilizador.id, conn);
        await chamadaModel.passarEmCurso(idChamada, conn); // a chamada só está "em curso" quando alguém atende
    });
    emitir('chamada:entrou', { idChamada, idUtilizador: utilizador.id });
    return detalhe(idChamada, utilizador.id);
}

async function recusar(idChamada, utilizador) {
    const { chamada, participante } = await carregarVisivel(idChamada, utilizador.id);
    exigirAtiva(chamada);
    if (participante.estado_participacao !== 'convidado') throw erro.conflict('Só pode recusar um convite pendente.');

    await participanteModel.recusar(idChamada, utilizador.id);
    emitir('chamada:recusada', { idChamada, idUtilizador: utilizador.id });

    // Se ainda ninguém atendeu e já ninguém falta responder, a chamada falhou
    if (chamada.estado === 'iniciada' && !(await participanteModel.listarIdsPorEstado(idChamada, 'convidado')).length) {
        await encerrar(idChamada, 'falhada', 'recusada');
    }
    return detalhe(idChamada, utilizador.id);
}

/**
 * Sair da chamada.
 * - Se o iniciador sai enquanto ainda ninguém atendeu, a chamada é cancelada.
 * - Se ficar menos de 2 pessoas dentro, a chamada termina.
 */
async function sair(idChamada, utilizador) {
    const { chamada, participante } = await carregarVisivel(idChamada, utilizador.id);
    exigirAtiva(chamada);
    if (!dentroDaChamada(participante)) throw erro.conflict('Não está dentro desta chamada.');

    if (chamada.estado === 'iniciada' && chamada.id_iniciador === utilizador.id) {
        await encerrar(idChamada, 'cancelada', 'cancelada_pelo_iniciador');
    } else {
        await participanteModel.sair(idChamada, utilizador.id);
        emitir('chamada:saiu', { idChamada, idUtilizador: utilizador.id });
        if ((await participanteModel.contarEmChamada(idChamada)) < 2) {
            await encerrar(idChamada, 'terminada', 'concluida');
        }
    }
    return detalhe(idChamada, utilizador.id);
}

/** O iniciador termina a chamada para todos. */
async function terminar(idChamada, utilizador) {
    const { chamada } = await carregarVisivel(idChamada, utilizador.id);
    if (chamada.id_iniciador !== utilizador.id) throw erro.forbidden('Apenas quem iniciou a chamada a pode terminar para todos.');
    exigirAtiva(chamada);

    if (chamada.estado === 'iniciada') await encerrar(idChamada, 'cancelada', 'cancelada_pelo_iniciador');
    else await encerrar(idChamada, 'terminada', 'concluida');
    return detalhe(idChamada, utilizador.id);
}

// ---------------------------------------------------------------------------
// Sinalização WebRTC (a ser chamada pelo módulo de sockets)
// ---------------------------------------------------------------------------

/**
 * Valida e guarda (cifrada) uma mensagem de sinalização (oferta, resposta, candidato ICE).
 * Só quem está dentro de uma chamada ativa pode sinalizar. Devolve a lista de colegas que a devem receber.
 */
async function registarSinalizacao(idChamada, idRemetente, tipoMensagem, conteudo) {
    if (!TIPOS_SINALIZACAO.includes(tipoMensagem)) throw erro.badRequest('Tipo de sinalização inválido.');
    if (conteudo === null || typeof conteudo !== 'object') throw erro.badRequest('Conteúdo de sinalização inválido.');
    if (Buffer.byteLength(JSON.stringify(conteudo)) > MAX_SINALIZACAO_BYTES) throw erro.badRequest('Mensagem de sinalização demasiado grande.');

    const { chamada, participante } = await carregarVisivel(idChamada, idRemetente);
    exigirAtiva(chamada);
    if (!dentroDaChamada(participante)) throw erro.forbidden('Não está dentro desta chamada.');

    await sinalizacaoModel.criar({ idChamada, idRemetente, tipoMensagem, conteudo });
    return (await participanteModel.listar(idChamada))
        .filter((p) => dentroDaChamada(p) && p.id_utilizador !== idRemetente)
        .map((p) => p.id_utilizador);
}

module.exports = {
    eventos, listar, listarAtivas, obterDetalhe: detalhe, configWebrtc,
    iniciar, entrar, recusar, sair, terminar, registarSinalizacao,
    MAX_EM_CHAMADA, TIMEOUT_TOCAR_S
};