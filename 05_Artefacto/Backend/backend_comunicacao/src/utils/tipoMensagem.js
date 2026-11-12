// Deduz mensagens.tipo_mensagem ('texto' | 'imagem' | 'ficheiro' | 'mista') a partir do conteúdo e dos anexos.
const IMAGENS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function calcularTipoMensagem(conteudo, anexos = []) {
    if (!anexos.length) return 'texto';
    if (conteudo) return 'mista';
    return anexos.every((a) => IMAGENS.includes(a.tipo_mime)) ? 'imagem' : 'ficheiro';
}

module.exports = calcularTipoMensagem;
module.exports.IMAGENS = IMAGENS;