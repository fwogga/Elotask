import express from "express";
import cors from "cors";
import pool from "./src/config/database.js";
import "dotenv/config";
import utilizadoresRoutes from "./src/routes/utilizadoresRoutes.js";
import autenticacaoRoutes from "./src/routes/autenticacaoRoutes.js";
import equipasRoutes from "./src/routes/equipasRoutes.js";
import membrosEquipaRoutes from "./src/routes/membrosEquipaRoutes.js";
import projetosRoutes from "./src/routes/projetosRoutes.js";
import membrosProjetoRoutes from "./src/routes/membrosProjetoRoutes.js";
import tarefasRoutes from "./src/routes/tarefasRoutes.js";
import responsaveisTarefaRoutes from "./src/routes/responsaveisTarefaRoutes.js";
import checklistsRoutes from "./src/routes/checklistsRoutes.js";
import itensChecklistRoutes from "./src/routes/itensChecklistRoutes.js";
import turnosRoutes from "./src/routes/turnosRoutes.js";
import turnoColaboradoresRoutes from "./src/routes/turnoColaboradoresRoutes.js";
import pedidosAusenciaRoutes from "./src/routes/pedidosAusenciaRoutes.js";
import pedidosTrocaTurnoRoutes from "./src/routes/pedidosTrocaTurnoRoutes.js";
import calendarioRoutes from "./src/routes/calendarioRoutes.js";
import historicoRoutes from "./src/routes/historicoRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Permite pedidos do frontend (Live Server noutra porta)
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    mensagem: "API do EloTask está a funcionar!"
  });
});

// Usado pelo ecrã "Estado do sistema" e pelo Docker para saber se o serviço está vivo
app.get("/health", (req, res) => {
  res.json({ sucesso: true, estado: "ok" });
});

app.get("/health/database", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", mensagem: "Ligação à base de dados estabelecida com sucesso." });
  } catch (error) {
    res.status(500).json({ status: "error", mensagem: "Não foi possível ligar à base de dados." });
  }
});

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

app.listen(PORT, () => {
  console.log(`Servidor a correr na porta ${PORT}`);
});