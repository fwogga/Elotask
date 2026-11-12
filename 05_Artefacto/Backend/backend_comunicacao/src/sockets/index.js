const { Server } = require('socket.io');
const env = require('../config/env');
const { identificarUtilizador } = require('../middleware/auth');
const notificacaoService = require('../services/notificacaoservice');
const chamadas = require('./chamadas');

/**
 * Liga o Socket.IO ao servidor HTTP.
 * Autenticação no handshake (igual à da API REST):
 *   - produção:  io(url, { auth: { token: '<JWT>' } })
 *   - AUTH_MODE=dev (testes):  io(url, { auth: { userId: 2 } })
 * Cada utilizador entra automaticamente na sua sala pessoal "utilizador:<id>".
 */
function iniciarSockets(servidorHttp) {
    const io = new Server(servidorHttp, {
        cors: { origin: env.corsOrigins.includes('*') ? true : env.corsOrigins },
        maxHttpBufferSize: 128 * 1024 // a sinalização é pequena (o serviço limita a 64 KB)
    });

    // Só entra quem se identificar; a identidade vem do token, nunca de dados enviados pelo cliente depois
    io.use(async (socket, next) => {
        try {
            const auth = socket.handshake.auth || {};
            socket.utilizador = await identificarUtilizador({
                token: auth.token || null,
                devUserId: auth.userId ?? socket.handshake.headers['x-user-id']
            });
            next();
        } catch (e) {
            next(new Error(e.message || 'Não autenticado.'));
        }
    });

    io.on('connection', (socket) => {
        socket.join(chamadas.sala(socket.utilizador.id));
        socket.emit('ligado', { id_utilizador: socket.utilizador.id, nome: socket.utilizador.nome });
        chamadas.registarHandlers(io, socket);
    });

    // Eventos de chamadas (tocar, entrar, sair, terminar) e notificações em tempo real
    chamadas.ligarEventosDoServico(io);
    notificacaoService.definirEmissor((idUtilizador, notificacao) => {
        io.to(chamadas.sala(idUtilizador)).emit('notificacao:nova', notificacao);
    });

    return io;
}

module.exports = { iniciarSockets };
