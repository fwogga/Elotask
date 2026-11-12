const service = require('../services/anexoservice');
const { descreverFicheiros, removerFicheiros } = require('../middleware/upload');
const { IMAGENS } = require('../utils/tipoMensagem');
const { erro } = require('../utils/httpError');

const ok = (res, dados, status = 200) => res.status(status).json({ sucesso: true, dados });

/** Content-Disposition seguro para nomes com acentos/aspas. */
function disposicao(tipo, nome) {
    const ascii = nome.replace(/[^\x20-\x7e]|["\\]/g, '_');
    const utf8 = encodeURIComponent(nome).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
    return `${tipo}; filename="${ascii}"; filename*=UTF-8''${utf8}`;
}

/** Corre ANTES do multer: se o utilizador não pode anexar, nenhum ficheiro chega a ser gravado. */
async function verificarPodeAnexar(req, res, next) {
    await service.verificarPodeAnexar(req.params.idMensagem, req.utilizador.id);
    next();
}

async function adicionar(req, res) {
    const ficheiros = descreverFicheiros(req.files);
    try {
        if (!ficheiros.length) throw erro.badRequest('Envie pelo menos um ficheiro (multipart/form-data, campo "ficheiros").');
        ok(res, await service.adicionar(req.params.idMensagem, req.utilizador.id, ficheiros), 201);
    } catch (e) {
        await removerFicheiros(ficheiros); // nada fica órfão em disco se a operação falhar
        throw e;
    }
}

/** Por defeito descarrega (attachment). Só imagens podem abrir no browser, com ?inline=1. */
async function descarregar(req, res, next) {
    const f = await service.descarregar(req.params.idAnexo, req.utilizador.id);
    const inline = req.query.inline === '1' && IMAGENS.includes(f.tipoMime);

    res.set({
        'Content-Type': f.tipoMime,
        'Content-Disposition': disposicao(inline ? 'inline' : 'attachment', f.nome),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-store'
    });
    res.sendFile(f.caminho, (err) => {
        if (err && !res.headersSent) next(err);
    });
}

async function eliminar(req, res) {
    ok(res, await service.eliminar(req.params.idAnexo, req.utilizador.id));
}

module.exports = { verificarPodeAnexar, adicionar, descarregar, eliminar };