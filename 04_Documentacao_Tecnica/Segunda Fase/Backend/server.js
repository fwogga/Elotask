import express from "express";
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

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    mensagem: "API do EloTask está a funcionar!"
  });
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

app.listen(PORT, () => {
  console.log(`Servidor a correr na porta ${PORT}`);
});

