const lembreteModel = require('../models/lembrete');
const notificacaoService = require('./notificacaoservice');
const env = require('../config/env');

const TITULOS = {
    prazo_proximo: 'Prazo próximo',
    prazo_hoje: 'Prazo hoje',
    prazo_ultrapassado: 'Prazo ultrapassado'
};

const ESTADOS = ['pendente', 'enviado', 'cancelado', 'falhado'];

// ---------------------------------------------------------------------------
// Consulta (API): cada utilizador só vê os SEUS lembretes
// ---------------------------------------------------------------------------

async function listarMeus(idUtilizador, { estado } = {}) {
    const lembretes = await lembreteModel.listarPorUtilizador(idUtilizador);
    return estado ? lembretes.filter((l) => l.estado === estado) : lembretes;
}

// ---------------------------------------------------------------------------
// Envio (processo em segundo plano): transforma lembretes vencidos em notificações
// ---------------------------------------------------------------------------

/**
 * Procura os lembretes pendentes cuja hora já passou e cria a notificação de cada um.
 * - Cria a notificação primeiro; só depois marca o lembrete como enviado.
 * - Se a criação falhar, o lembrete fica "falhado" e o ciclo continua com os restantes.
 * Devolve quantos foram enviados e quantos falharam.
 */
async function processarVencidos() {
    const vencidos = await lembreteModel.listarPendentesVencidos(100);
    let enviados = 0;
    let falhados = 0;

    for (const l of vencidos) {
        try {
            await notificacaoService.criar({
                idUtilizador: l.id_utilizador,
                tipo: 'prazo',
                titulo: TITULOS[l.tipo_lembrete] || 'Lembrete de prazo',
                mensagem: l.mensagem,
                entidadeTipo: 'tarefa',
                entidadeId: l.id_tarefa
            });
            await lembreteModel.marcarEnviado(l.id_lembrete);
            enviados += 1;
        } catch (e) {
            console.error(`[lembretes] falha no lembrete ${l.id_lembrete}:`, e.message);
            await lembreteModel.marcarFalhado(l.id_lembrete).catch(() => {});
            falhados += 1;
        }
    }
    return { enviados, falhados };
}

// ---------------------------------------------------------------------------
// Arranque do ciclo (chamado uma vez pelo server.js)
// ---------------------------------------------------------------------------

/** Liga o ciclo periódico. Devolve uma função que o pára (ou null se estiver desligado no .env). */
function iniciar() {
    if (!env.lembretes.ativos) {
        console.log('[lembretes] desativados (LEMBRETES_ATIVOS=false)');
        return null;
    }

    let aCorrer = false; // evita dois ciclos ao mesmo tempo se um demorar mais do que o intervalo
    const ciclo = async () => {
        if (aCorrer) return;
        aCorrer = true;
        try {
            const { enviados, falhados } = await processarVencidos();
            if (enviados || falhados) console.log(`[lembretes] enviados: ${enviados}, falhados: ${falhados}`);
        } catch (e) {
            console.error('[lembretes] erro no ciclo:', e.message);
        } finally {
            aCorrer = false;
        }
    };

    const temporizador = setInterval(ciclo, env.lembretes.intervaloS * 1000);
    temporizador.unref(); // não impede o servidor de terminar
    ciclo(); // primeira verificação logo no arranque
    console.log(`[lembretes] ativos (verificação de ${env.lembretes.intervaloS} em ${env.lembretes.intervaloS} s)`);
    return () => clearInterval(temporizador);
}

module.exports = { ESTADOS, listarMeus, processarVencidos, iniciar };