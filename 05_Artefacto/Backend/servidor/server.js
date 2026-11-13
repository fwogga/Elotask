// Servidor único do EloTask: API principal (projetos, tarefas, turnos...) e
// comunicação (mensagens, reuniões, chamadas, IA) na mesma porta e na mesma base de dados.
import "dotenv/config";
import http from "node:http";
import express from "express";
import cors from "cors";

import comunicacao from "./src/comunicacao/app.js";
import env from "./src/comunicacao/config/env.js";
import pool from "./src/comunicacao/config/database.js";
import lembretes from "./src/comunicacao/services/lembreteservice.js";
import { iniciarSockets } from "./src/comunicacao/sockets/index.js";

import utilizadoresRoutes from "./src/principal/routes/utilizadoresRoutes.js";
import autenticacaoRoutes from "./src/principal/routes/autenticacaoRoutes.js";
import equipasRoutes from "./src/principal/routes/equipasRoutes.js";
import membrosEquipaRoutes from "./src/principal/routes/membrosEquipaRoutes.js";
import projetosRoutes from "./src/principal/routes/projetosRoutes.js";
import membrosProjetoRoutes from "./src/principal/routes/membrosProjetoRoutes.js";
import tarefasRoutes from "./src/principal/routes/tarefasRoutes.js";
import responsaveisTarefaRoutes from "./src/principal/routes/responsaveisTarefaRoutes.js";
import checklistsRoutes from "./src/principal/routes/checklistsRoutes.js";
import itensChecklistRoutes from "./src/principal/routes/itensChecklistRoutes.js";
import turnosRoutes from "./src/principal/routes/turnosRoutes.js";
import turnoColaboradoresRoutes from "./src/principal/routes/turnoColaboradoresRoutes.js";
import pedidosAusenciaRoutes from "./src/principal/routes/pedidosAusenciaRoutes.js";
import pedidosTrocaTurnoRoutes from "./src/principal/routes/pedidosTrocaTurnoRoutes.js";
import calendarioRoutes from "./src/principal/routes/calendarioRoutes.js";
import historicoRoutes from "./src/principal/routes/historicoRoutes.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/utilizadores", utilizadoresRoutes);
app.use("/autenticacao", autenticacaoRoutes);
app.use("/equipas", equipasRoutes);
app.use("/equipas", membrosEquipaRoutes);
app.use("/projetos", projetosRoutes);
app.use("/projetos", membrosProjetoRoutes);
app.use("/projetos", tarefasRoutes);
app.use("/projetos", responsaveisTarefaRoutes);
app.use("/projetos", checklistsRoutes);
app.use("/projetos", itensChecklistRoutes);
app.use("/turnos", turnosRoutes);
app.use("/turnos", turnoColaboradoresRoutes);
app.use("/pedidos-ausencia", pedidosAusenciaRoutes);
app.use("/pedidos-troca-turno", pedidosTrocaTurnoRoutes);
app.use("/calendario", calendarioRoutes);
app.use("/historico", historicoRoutes);

// Tudo o resto (/api/...) e as respostas de erro ficam com a parte de comunicação
app.use(comunicacao);

try {
  await pool.query("SELECT 1");
  console.log(`[bd] ligada a ${env.database.name} em ${env.database.host}:${env.database.port}`);
} catch (erro) {
  console.error("[bd] não foi possível ligar à base de dados:", erro.code || erro.message);
  process.exit(1);
}

const servidor = http.createServer(app);
iniciarSockets(servidor);

servidor.on("error", (erro) => {
  console.error(`[http] não foi possível abrir a porta ${env.port}:`, erro.code || erro.message);
  process.exit(1);
});

servidor.listen(env.port, () => {
  console.log(`Servidor do EloTask na porta ${env.port} (API + Socket.IO)`);
  // Transforma lembretes vencidos em notificações (desligado na cópia do Docker)
  lembretes.iniciar();
});

// Se a base de dados deixar de responder, o servidor fecha a porta: assim o balanceador
// manda os pedidos para a outra cópia. Volta a abrir quando a base de dados responder.
setInterval(async () => {
  let bdOk = true;
  try {
    await pool.query("SELECT 1");
  } catch {
    bdOk = false;
  }
  if (!bdOk && servidor.listening) {
    console.error("[bd] sem resposta: a fechar a porta até a base de dados voltar");
    servidor.close();
    servidor.closeAllConnections();
  } else if (bdOk && !servidor.listening) {
    servidor.listen(env.port, () => console.log("[bd] de volta: porta aberta outra vez"));
  }
}, 3000);
