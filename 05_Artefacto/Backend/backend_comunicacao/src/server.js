require('dotenv').config();

const http = require('http');
const app = require('./app');
const env = require('./config/env');
const pool = require('./config/database');
const lembreteService = require('./services/lembreteservice');
const { iniciarSockets } = require('./sockets');

const PORT = env.port;

pool.query('SELECT 1')
    .then(() => {
        console.log(`[bd] ligada a ${env.database.name} em ${env.database.host}:${env.database.port}`);

        const servidor = http.createServer(app);
        iniciarSockets(servidor);

        servidor.on('error', (erro) => {
            console.error(`[http] não foi possível abrir a porta ${PORT}:`, erro.code || erro.message);
            process.exit(1);
        });

        servidor.listen(PORT, () => {
            console.log(`Backend de Comunicação do EloTask ativo na porta ${PORT} (API + Socket.IO)`);

            // Ciclo em segundo plano: transforma lembretes vencidos em notificações
            lembreteService.iniciar();
        });
    })
    .catch((erro) => {
        console.error('[bd] não foi possível ligar à base de dados:', erro.code || erro.errors?.[0]?.code || erro.message);
        process.exit(1);
    });