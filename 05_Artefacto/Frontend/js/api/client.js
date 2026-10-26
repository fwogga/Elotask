// Único sítio onde as páginas vão buscar dados.
// Enquanto o backend não existe, devolve os mocks. No passo 12 muda-se
// USAR_MOCKS para false e as páginas continuam iguais.
import * as mocks from "../mocks/dados.js";

const USAR_MOCKS = true;
const API_URL = "http://localhost:3000/api";

async function pedido(rota) {
  const resposta = await fetch(`${API_URL}${rota}`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!resposta.ok) {
    throw new Error(`Erro ${resposta.status} em ${rota}`);
  }
  return resposta.json();
}

// Cópia dos dados, para uma página não alterar os mocks das outras
const simular = (dados) => Promise.resolve(structuredClone(dados));

export const getUtilizadorAtual = () =>
  USAR_MOCKS ? simular(mocks.utilizadorAtual) : pedido("/utilizadores/eu");

export const getResumo = () =>
  USAR_MOCKS ? simular(mocks.resumo) : pedido("/dashboard/resumo");

export const getProjetos = () =>
  USAR_MOCKS ? simular(mocks.projetos) : pedido("/projetos");

export const getTarefasRecentes = () =>
  USAR_MOCKS ? simular(mocks.tarefasRecentes) : pedido("/tarefas?recentes=1");

export const getProximasReunioes = () =>
  USAR_MOCKS ? simular(mocks.proximasReunioes) : pedido("/reunioes?proximas=1");
