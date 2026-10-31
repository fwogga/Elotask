import express from "express";
import "dotenv/config";
import utilizadoresRoutes from "./src/routes/utilizadoresRoutes.js";
import autenticacaoRoutes from "./src/routes/autenticacaoRoutes.js";
import equipasRoutes from "./src/routes/equipasRoutes.js";
import membrosEquipaRoutes from "./src/routes/membrosEquipaRoutes.js";

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

app.listen(PORT, () => {
  console.log(`Servidor a correr na porta ${PORT}`);
});

