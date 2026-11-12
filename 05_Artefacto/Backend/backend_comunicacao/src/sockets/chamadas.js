const chamadaService = require('../services/chamadaservice');
const participanteChamadaModel = require('../models/participantechamada');

// Sala pessoal de cada utilizador: o servidor decide SEMPRE quem recebe o quê,
// nunca o cliente (assim ninguém consegue ouvir chamadas alheias).
const sala = (idUtilizador) => `utilizador:${idUtilizador}`;

// Limite simples por ligação: no máximo MAX_EVENTOS sinalizações em cada JANELA_MS
const MAX_EVENTOS = 100;
const JANELA_MS = 5000;

/** Resposta de erro para o cliente (reaproveita a mensagem dos erros "esperados"; esconde os internos). */
function respostaErro(e) {
    if (e && e.status && e.status < 500) return { sucesso: false, erro: e.message };
    console.error('[sockets] erro na sinalização:', e && e.message);
    return { sucesso: false, erro: 'Erro interno do servidor.' };
}

/** Quem está ligado a uma chamada (para lhes avisar de entradas, saídas e do fim). */
async function idsDaChamada(idChamada) {
    const participantes = await participanteChamadaModel.listar(idChamada);
    return participantes.map((p) => p.id_utilizador);
}

// ---------------------------------------------------------------------------
// Eventos do serviço de chamadas -> clientes ligados
// ---------------------------------------------------------------------------
function ligarEventosDoServico(io) {
    const { eventos } = chamadaService;

    eventos.on('chamada:iniciada', ({ chamada, convidados }) => {
        for (const id of convidados) io.to(sala(id)).emit('chamada:recebida', { chamada });
    });

    const avisarParticipantes = (nomeSocket) => async ({ idChamada, idUtilizador }) => {
        try {
            for (const id of await idsDaChamada(idChamada)) {
                if (id !== idUtilizador) io.to(sala(id)).emit(nomeSocket, { id_chamada: idChamada, id_utilizador: idUtilizador });
            }
        } catch (e) {
            console.error(`[sockets] falha ao avisar "${nomeSocket}":`, e.message);
        }
    };
    eventos.on('chamada:entrou', avisarParticipantes('chamada:participante_entrou'));
    eventos.on('chamada:saiu', avisarParticipantes('chamada:participante_saiu'));
    eventos.on('chamada:recusada', avisarParticipantes('chamada:participante_recusou'));

    eventos.on('chamada:terminada', async ({ idChamada, estado, motivo }) => {
        try {
            for (const id of await idsDaChamada(idChamada)) {
                io.to(sala(id)).emit('chamada:terminada', { id_chamada: idChamada, estado, motivo });
            }
        } catch (e) {
            console.error('[sockets] falha ao avisar o fim da chamada:', e.message);
        }
    });
}

// ---------------------------------------------------------------------------
// Eventos que o cliente envia
// ---------------------------------------------------------------------------
function registarHandlers(io, socket) {
    let janelaInicio = Date.now();
    let contagem = 0;

    /**
     * Cliente -> servidor:  socket.emit('chamada:sinalizar', { id_chamada, tipo_mensagem, conteudo, para? }, ack)
     *   tipo_mensagem: 'oferta' | 'resposta' | 'candidato_ice'
     *   para (opcional): id do colega que deve receber; sem "para" recebem todos os outros na chamada.
     * Servidor -> colegas:   'chamada:sinalizacao' { id_chamada, de, tipo_mensagem, conteudo }
     */
    socket.on('chamada:sinalizar', async (dados, ack) => {
        const responder = typeof ack === 'function' ? ack : () => {};

        const agora = Date.now();
        if (agora - janelaInicio > JANELA_MS) { janelaInicio = agora; contagem = 0; }
        contagem += 1;
        if (contagem > MAX_EVENTOS) return responder({ sucesso: false, erro: 'Demasiados pedidos de sinalização.' });

        try {
            const d = dados && typeof dados === 'object' ? dados : {};
            const idChamada = Number(d.id_chamada);
            if (!Number.isInteger(idChamada) || idChamada <= 0) return responder({ sucesso: false, erro: 'id_chamada inválido.' });

            let destinatarios = await chamadaService.registarSinalizacao(
                idChamada, socket.utilizador.id, d.tipo_mensagem, d.conteudo
            );

            if (d.para !== undefined && d.para !== null) {
                const para = Number(d.para);
                if (!destinatarios.includes(para)) return responder({ sucesso: false, erro: 'Esse participante não está na chamada.' });
                destinatarios = [para];
            }

            for (const id of destinatarios) {
                io.to(sala(id)).emit('chamada:sinalizacao', {
                    id_chamada: idChamada,
                    de: socket.utilizador.id,
                    tipo_mensagem: d.tipo_mensagem,
                    conteudo: d.conteudo
                });
            }
            responder({ sucesso: true, dados: { entregue_a: destinatarios } });
        } catch (e) {
            responder(respostaErro(e));
        }
    });
}

module.exports = { sala, ligarEventosDoServico, registarHandlers };