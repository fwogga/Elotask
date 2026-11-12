const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const env = require('../config/env');
const { erro } = require('../utils/httpError');

// Pasta fixa dentro do projeto; na BD guarda-se o caminho relativo (ex.: uploads/mensagens/xxxx.pdf)
const RAIZ = process.cwd();
const PASTA_RELATIVA = path.posix.join('uploads', 'mensagens');
const PASTA_ABSOLUTA = path.resolve(RAIZ, PASTA_RELATIVA);
fs.mkdirSync(PASTA_ABSOLUTA, { recursive: true });

// Lista branca: extensão -> tipos MIME aceites
const PERMITIDOS = {
    jpg: ['image/jpeg'], jpeg: ['image/jpeg'], png: ['image/png'], gif: ['image/gif'], webp: ['image/webp'],
    pdf: ['application/pdf'],
    txt: ['text/plain'], md: ['text/markdown', 'text/plain'], csv: ['text/csv', 'application/vnd.ms-excel', 'text/plain'],
    doc: ['application/msword'],
    docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    xls: ['application/vnd.ms-excel'],
    xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    ppt: ['application/vnd.ms-powerpoint'],
    pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    zip: ['application/zip', 'application/x-zip-compressed'],
    mp3: ['audio/mpeg'], wav: ['audio/wav', 'audio/x-wav'],
    mp4: ['video/mp4'], webm: ['video/webm', 'audio/webm']
};

function nomeOriginalSeguro(nome) {
    // O multer interpreta o nome como latin1; recupera o UTF-8 original.
    const utf8 = Buffer.from(nome, 'latin1').toString('utf8');
    return path.basename(utf8.replace(/[\u0000-\u001f\u007f]/g, '')).slice(0, 255) || 'ficheiro';
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, PASTA_ABSOLUTA),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).slice(1).toLowerCase();
        cb(null, `${crypto.randomUUID()}.${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).slice(1).toLowerCase();
    const mimes = PERMITIDOS[ext];
    if (!mimes) return cb(erro.badRequest(`Extensão não permitida: .${ext || '(sem extensão)'}`));
    if (!mimes.includes(file.mimetype)) return cb(erro.badRequest(`Tipo de ficheiro não corresponde à extensão .${ext}.`));
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: env.upload.maxBytes, files: env.upload.maxFiles }
});

/** Aceita até N ficheiros no campo "ficheiros" (multipart/form-data). Pedidos JSON passam sem alterações. */
const uploadAnexos = upload.array('ficheiros', env.upload.maxFiles);

/** Converte os ficheiros do multer no formato usado pelos serviços/modelos. */
function descreverFicheiros(files = []) {
    return files.map((f) => ({
        nome_ficheiro: nomeOriginalSeguro(f.originalname),
        nome_armazenamento: f.filename,
        caminho_ficheiro: path.posix.join(PASTA_RELATIVA, f.filename),
        tipo_mime: f.mimetype,
        extensao: path.extname(f.originalname).slice(1).toLowerCase() || null,
        tamanho_bytes: f.size,
        caminho_absoluto: f.path
    }));
}

/** Apaga ficheiros já gravados em disco (usado quando a operação falha). */
async function removerFicheiros(ficheiros = []) {
    await Promise.all(
        ficheiros.map((f) => fs.promises.unlink(f.caminho_absoluto || f.path).catch(() => {}))
    );
}

// ---------------------------------------------------------------------------
// Verificação do conteúdo real: o multer só vê a extensão e o MIME declarados pelo cliente
// (ambos falsificáveis). Aqui confirma-se que os primeiros bytes correspondem ao tipo.
// ---------------------------------------------------------------------------
const comeca = (buf, ...bytes) => bytes.every((b, i) => buf[i] === b);
const ascii = (buf, texto, offset = 0) =>
    buf.length >= offset + texto.length && buf.toString('latin1', offset, offset + texto.length) === texto;
const semNulos = (buf) => !buf.includes(0);

const jpeg = (b) => comeca(b, 0xff, 0xd8, 0xff);
const zip = (b) => ascii(b, 'PK');
const ole = (b) => comeca(b, 0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1);

const VERIFICADORES = {
    jpg: jpeg, jpeg,
    png: (b) => comeca(b, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a),
    gif: (b) => ascii(b, 'GIF87a') || ascii(b, 'GIF89a'),
    webp: (b) => ascii(b, 'RIFF') && ascii(b, 'WEBP', 8),
    pdf: (b) => ascii(b, '%PDF-'),
    zip, docx: zip, xlsx: zip, pptx: zip,
    doc: ole, xls: ole, ppt: ole,
    mp3: (b) => ascii(b, 'ID3') || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0),
    wav: (b) => ascii(b, 'RIFF') && ascii(b, 'WAVE', 8),
    mp4: (b) => ascii(b, 'ftyp', 4),
    webm: (b) => comeca(b, 0x1a, 0x45, 0xdf, 0xa3),
    txt: semNulos, md: semNulos, csv: semNulos
};

async function lerInicio(caminho, n = 4096) {
    const fh = await fs.promises.open(caminho, 'r');
    try {
        const buf = Buffer.alloc(n);
        const { bytesRead } = await fh.read(buf, 0, n, 0);
        return buf.subarray(0, bytesRead);
    } finally {
        await fh.close();
    }
}

/** Middleware (depois do multer): rejeita ficheiros vazios ou cujo conteúdo não corresponde à extensão. */
async function validarConteudo(req, res, next) {
    const ficheiros = req.files || [];
    try {
        for (const f of ficheiros) {
            const ext = path.extname(f.originalname).slice(1).toLowerCase();
            const nome = nomeOriginalSeguro(f.originalname);
            const inicio = await lerInicio(f.path);
            if (f.size === 0 || inicio.length === 0) {
                await removerFicheiros(ficheiros);
                return next(erro.badRequest(`O ficheiro "${nome}" está vazio.`));
            }
            const verificador = VERIFICADORES[ext];
            if (!verificador || !verificador(inicio)) {
                await removerFicheiros(ficheiros);
                return next(erro.badRequest(`O conteúdo de "${nome}" não corresponde ao tipo .${ext}.`));
            }
        }
        next();
    } catch (e) {
        await removerFicheiros(ficheiros);
        next(e);
    }
}

/** Usar nas rotas: recebe os ficheiros (campo "ficheiros") e valida-os. Pedidos JSON passam sem alterações. */
const receberAnexos = [uploadAnexos, validarConteudo];

/** Apaga do disco ficheiros referidos por caminho relativo (os da BD). Nunca lança: falhas ficam no log. */
async function apagarCaminhos(caminhosRelativos = []) {
    await Promise.all(caminhosRelativos.map(async (c) => {
        const abs = resolverCaminhoSeguro(c);
        if (!abs) return;
        try {
            await fs.promises.unlink(abs);
        } catch (e) {
            if (e.code !== 'ENOENT') console.error('[upload] não foi possível apagar', c, e.message);
        }
    }));
}

/** Resolve um caminho guardado na BD, garantindo que fica dentro da pasta uploads/. */
function resolverCaminhoSeguro(caminhoRelativo) {
    const raizUploads = path.resolve(RAIZ, 'uploads');
    const abs = path.resolve(RAIZ, caminhoRelativo);
    if (abs !== raizUploads && !abs.startsWith(raizUploads + path.sep)) return null;
    return abs;
}

module.exports = {
    uploadAnexos, validarConteudo, receberAnexos, descreverFicheiros, removerFicheiros, apagarCaminhos, resolverCaminhoSeguro
};