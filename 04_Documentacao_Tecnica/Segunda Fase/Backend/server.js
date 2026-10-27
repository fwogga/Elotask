import express from "express";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    mensagem: "API do EloTask está a funcionar!"
  });
});

app.listen(PORT, () => {
  console.log(`Servidor a correr na porta ${PORT}`);
});

