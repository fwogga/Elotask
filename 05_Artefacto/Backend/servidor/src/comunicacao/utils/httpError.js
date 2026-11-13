class HttpError extends Error {
    constructor(status, message, detalhes) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
        this.detalhes = detalhes;
    }
}

const erro = {
    badRequest: (m = 'Pedido inválido.', d) => new HttpError(400, m, d),
    unauthorized: (m = 'Autenticação necessária.') => new HttpError(401, m),
    forbidden: (m = 'Sem permissão para esta operação.') => new HttpError(403, m),
    notFound: (m = 'Recurso não encontrado.') => new HttpError(404, m),
    conflict: (m = 'Conflito com o estado atual do recurso.') => new HttpError(409, m),
    unavailable: (m = 'Serviço indisponível.') => new HttpError(503, m)
};

module.exports = { HttpError, erro };
