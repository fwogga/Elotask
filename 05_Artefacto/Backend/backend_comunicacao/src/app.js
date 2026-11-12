const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const db = require('./config/database');
const { naoEncontrado, tratarErros } = require('./middleware/error');

const app = express();

// --- Middlewares globais ---
app.use(cors({ origin: env.corsOrigins.includes('*') ? true : env.corsOrigins }));
app.use(express.json({ limit: '1mb' }));

// Estado do servidor (não toca na base de dados)
app.get('/api/health', (req, res) => {
    res.json({ sucesso: true, estado: 'ok' });
});

// teste de ligação à base de dados
app.get('/api/health/database', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT DATABASE() AS base_dados');

        res.status(200).json({
            status: 'ok',
            mensagem: 'Ligação à base de dados estabelecida com sucesso.',
            baseDados: rows[0].base_dados
        });
    } catch (error) {
        console.error('Erro na ligação à base de dados:', error.code || error.errors?.[0]?.code || error.message);

        res.status(500).json({
            status: 'error',
            mensagem: 'Não foi possível estabelecer ligação à base de dados.'
        });
    }
});

// estado do serviço de IA (Python)
app.get('/api/health/ia', async (req, res) => {
    try {
        const resposta = await fetch(`${env.ia.url}/health`, { signal: AbortSignal.timeout(3000) });
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
        res.json({ status: 'ok', mensagem: 'Serviço de IA disponível.' });
    } catch (error) {
        res.status(503).json({ status: 'error', mensagem: 'Serviço de IA indisponível.' });
    }
});

// modulos
app.use('/api', require('./routes/utilizadorroutes'));
app.use('/api/conversas', require('./routes/conversaroutes'));
app.use('/api/eventos', require('./routes/eventoroutes'));
app.use('/api/notificacoes', require('./routes/notificacaoroutes'));
app.use('/api/reunioes', require('./routes/reuniaoroutes'));
app.use('/api/chamadas', require('./routes/chamadaroutes'));
// estes três já trazem o caminho completo nas rotas (/conversas/:id/mensagens, /canais/..., /anexos/...)
app.use('/api', require('./routes/mensagemroutes'));
app.use('/api', require('./routes/canalroutes'));
app.use('/api', require('./routes/anexoroutes'));
app.use('/api/lembretes', require('./routes/lembreteroutes'));
app.use('/api/ia', require('./routes/iaroutes'));

// mensagens de erro
app.use(naoEncontrado);
app.use(tratarErros);

module.exports = app;
