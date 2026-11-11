// Único sítio onde as páginas vão buscar e guardar dados.
// Enquanto o backend não existe, usa os mocks guardados no localStorage
// (assim o que se cria numa página aparece nas outras e sobrevive a um F5).
// No passo 12 muda-se USAR_MOCKS para false e as páginas continuam iguais.
import * as seeds from "../mocks/dados.js";

const USAR_MOCKS = true;
const API_URL = "http://localhost:3000/api";
const CHAVE = "elotask-mocks-v2";
// comentado para não usar dados antigos 
//const CHAVE = "elotask-mocks-v1";

async function pedido(rota, { metodo = "GET", corpo } = {}) {
  const resposta = await fetch(`${API_URL}${rota}`, {
    method: metodo,
    credentials: "include",
    headers: { Accept: "application/json", ...(corpo ? { "Content-Type": "application/json" } : {}) },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  if (!resposta.ok) {
    throw new Error(`Erro ${resposta.status} em ${rota}`);
  }
  return resposta.status === 204 ? null : resposta.json();
}

// --- Store dos mocks ------------------------------------------------------

function estadoInicial() {
  return structuredClone({
    utilizadorAtualId: seeds.utilizadorAtualId,
    utilizadores: seeds.utilizadores,
    projetos: seeds.projetos,
    tarefas: seeds.tarefas,
    reunioes: seeds.reunioes,
    conversas: seeds.conversas,
    mensagens: seeds.mensagens,
    naoLidas: seeds.naoLidas,
    documentos: seeds.documentos,
    equipas: seeds.equipas,
    convites: seeds.convites,
  });
}

function carregar() {
  try {
    const guardado = localStorage.getItem(CHAVE);
    if (guardado) return JSON.parse(guardado);
  } catch {
    // localStorage indisponível (ex.: modo privado): usa só memória
  }
  return estadoInicial();
}

let db = carregar();

function guardar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(db));
  } catch {
    // sem localStorage os dados ficam só até recarregar a página
  }
}

// Repõe os dados de exemplo (útil antes de uma demonstração)
export function reporDados() {
  db = estadoInicial();
  guardar();
}

const proximoId = (lista) => Math.max(0, ...lista.map((x) => x.id)) + 1;
const copia = (dados) => Promise.resolve(structuredClone(dados));
const naoEncontrado = (o) => Promise.reject(new Error(`${o} não encontrado`));

function comProgresso(projeto) {
  const doProjeto = db.tarefas.filter((t) => t.projetoId === projeto.id);
  const concluidas = doProjeto.filter((t) => t.estado === "concluida").length;
  return {
    ...projeto,
    progresso: doProjeto.length ? Math.round((concluidas / doProjeto.length) * 100) : 0,
    tarefasPendentes: doProjeto.length - concluidas,
  };
}

const eHoje = (iso) => new Date(iso).toDateString() === new Date().toDateString();

// --- Utilizadores ---------------------------------------------------------

export function getUtilizadorAtual() {
  if (!USAR_MOCKS) return pedido("/utilizadores/eu");
  const eu = db.utilizadores.find((u) => u.id === db.utilizadorAtualId);
  const totalNaoLidas = Object.values(db.naoLidas).reduce((a, b) => a + b, 0);
  return copia({ ...eu, naoLidas: { mensagens: totalNaoLidas } });
}

export const getUtilizadores = () =>
  USAR_MOCKS ? copia(db.utilizadores) : pedido("/utilizadores");

// --- Sessão ---------------------------------------------------------------

const CORES_AVATAR = ["primaria", "violeta", "menta", "laranja"];

// Com mocks não há palavras-passe nem validações: se o email (ou a parte antes
// do @) existir entra com essa pessoa, senão continua com o utilizador atual
export function iniciarSessao({ identificador, palavra, manter }) {
  if (!USAR_MOCKS) return pedido("/auth/login", { metodo: "POST", corpo: { identificador, palavra, manter } });
  const procura = identificador.trim().toLowerCase();
  const u = procura && db.utilizadores.find((x) => x.email === procura || x.email.split("@")[0] === procura);
  if (u) {
    db.utilizadorAtualId = u.id;
    guardar();
  }
  return copia(db.utilizadores.find((x) => x.id === db.utilizadorAtualId));
}

// Campos vazios recebem valores por defeito; um email repetido reutiliza a conta
export function registar({ nome, email, telefone, nascimento, palavra }) {
  if (!USAR_MOCKS) return pedido("/auth/registo", { metodo: "POST", corpo: { nome, email, telefone, nascimento, palavra } });
  const existente = email && db.utilizadores.find((u) => u.email === email);
  if (existente) return copia(existente);
  const id = proximoId(db.utilizadores);
  const novo = {
    id,
    nome: nome || `Utilizador ${id}`,
    email: email || `utilizador${id}@elotask.pt`,
    telefone, nascimento,
    funcao: "Membro",
    cor: CORES_AVATAR[db.utilizadores.length % CORES_AVATAR.length],
  };
  db.utilizadores.push(novo);
  guardar();
  return copia(novo);
}

// --- Dashboard ------------------------------------------------------------

export function getResumo() {
  if (!USAR_MOCKS) return pedido("/dashboard/resumo");
  return copia({
    projetosAtivos: db.projetos.filter((p) => p.estado !== "concluido").length,
    tarefasPendentes: db.tarefas.filter((t) => t.estado !== "concluida").length,
    reunioesHoje: db.reunioes.filter((r) => eHoje(r.inicio)).length,
    membrosEquipa: db.utilizadores.length,
  });
}

// --- Projetos -------------------------------------------------------------

export const getProjetos = () =>
  USAR_MOCKS ? copia(db.projetos.map(comProgresso)) : pedido("/projetos");

export function getProjeto(id) {
  if (!USAR_MOCKS) return pedido(`/projetos/${id}`);
  const projeto = db.projetos.find((p) => p.id === Number(id));
  return projeto ? copia(comProgresso(projeto)) : naoEncontrado("Projeto");
}

// --- Tarefas --------------------------------------------------------------

export const getTarefas = () =>
  USAR_MOCKS ? copia(db.tarefas) : pedido("/tarefas");

export function getTarefasRecentes() {
  if (!USAR_MOCKS) return pedido("/tarefas?recentes=1");
  const pendentes = db.tarefas
    .filter((t) => t.estado !== "concluida")
    .sort((a, b) => a.prazo.localeCompare(b.prazo));
  return copia(pendentes.slice(0, 3));
}

export function criarTarefa(dados) {
  if (!USAR_MOCKS) return pedido("/tarefas", { metodo: "POST", corpo: dados });
  const tarefa = { estado: "por_fazer", ...dados, id: proximoId(db.tarefas) };
  db.tarefas.push(tarefa);
  guardar();
  return copia(tarefa);
}

export function atualizarTarefa(id, alteracoes) {
  if (!USAR_MOCKS) return pedido(`/tarefas/${id}`, { metodo: "PATCH", corpo: alteracoes });
  const tarefa = db.tarefas.find((t) => t.id === id);
  if (!tarefa) return naoEncontrado("Tarefa");
  Object.assign(tarefa, alteracoes);
  guardar();
  return copia(tarefa);
}

export function apagarTarefa(id) {
  if (!USAR_MOCKS) return pedido(`/tarefas/${id}`, { metodo: "DELETE" });
  db.tarefas = db.tarefas.filter((t) => t.id !== id);
  guardar();
  return Promise.resolve(null);
}

// --- Reuniões -------------------------------------------------------------

export const getReunioes = () =>
  USAR_MOCKS ? copia([...db.reunioes].sort((a, b) => a.inicio.localeCompare(b.inicio))) : pedido("/reunioes");

export function getProximasReunioes() {
  if (!USAR_MOCKS) return pedido("/reunioes?proximas=1");
  const agora = new Date().toISOString();
  const proximas = db.reunioes
    .filter((r) => r.fim >= agora)
    .sort((a, b) => a.inicio.localeCompare(b.inicio));
  return copia(proximas.slice(0, 2));
}

export function criarReuniao(dados) {
  if (!USAR_MOCKS) return pedido("/reunioes", { metodo: "POST", corpo: dados });
  const reuniao = { ...dados, id: proximoId(db.reunioes), organizadorId: db.utilizadorAtualId };
  db.reunioes.push(reuniao);
  guardar();
  return copia(reuniao);
}

// --- Mensagens ------------------------------------------------------------

export function getConversas() {
  if (!USAR_MOCKS) return pedido("/conversas");
  const lista = db.conversas.map((c) => {
    const msgs = db.mensagens.filter((m) => m.conversaId === c.id);
    return { ...c, ultima: msgs.at(-1) ?? null, naoLidas: db.naoLidas[c.id] ?? 0 };
  });
  lista.sort((a, b) => (b.ultima?.enviadaEm ?? "").localeCompare(a.ultima?.enviadaEm ?? ""));
  return copia(lista);
}

export function getMensagens(conversaId) {
  if (!USAR_MOCKS) return pedido(`/conversas/${conversaId}/mensagens`);
  return copia(db.mensagens.filter((m) => m.conversaId === conversaId));
}

export function marcarComoLida(conversaId) {
  if (!USAR_MOCKS) return pedido(`/conversas/${conversaId}/lida`, { metodo: "POST" });
  delete db.naoLidas[conversaId];
  guardar();
  return Promise.resolve(null);
}

export function enviarMensagem(conversaId, { texto = "", anexo = null }) {
  if (!USAR_MOCKS) return pedido(`/conversas/${conversaId}/mensagens`, { metodo: "POST", corpo: { texto, anexo } });
  const mensagem = {
    id: proximoId(db.mensagens),
    conversaId,
    autorId: db.utilizadorAtualId,
    texto,
    enviadaEm: new Date().toISOString(),
    ...(anexo ? { anexo } : {}),
  };
  db.mensagens.push(mensagem);
  guardar();
  return copia(mensagem);
}

// --- Documentos -----------------------------------------------------------

export const getDocumentos = () =>
  USAR_MOCKS
    ? copia([...db.documentos].sort((a, b) => b.modificadoEm.localeCompare(a.modificadoEm)))
    : pedido("/documentos");

// Com a API real isto será um upload (FormData); nos mocks guarda só os metadados
export function carregarDocumento({ nome, tamanho, projetoId = null }) {
  if (!USAR_MOCKS) return pedido("/documentos", { metodo: "POST", corpo: { nome, tamanho, projetoId } });
  const documento = {
    id: proximoId(db.documentos),
    nome,
    tamanho,
    projetoId,
    modificadoEm: new Date().toISOString(),
    donoId: db.utilizadorAtualId,
  };
  db.documentos.push(documento);
  guardar();
  return copia(documento);
}

export function renomearDocumento(id, nome) {
  if (!USAR_MOCKS) return pedido(`/documentos/${id}`, { metodo: "PATCH", corpo: { nome } });
  const documento = db.documentos.find((d) => d.id === id);
  if (!documento) return naoEncontrado("Documento");
  Object.assign(documento, { nome, modificadoEm: new Date().toISOString() });
  guardar();
  return copia(documento);
}

export function apagarDocumento(id) {
  if (!USAR_MOCKS) return pedido(`/documentos/${id}`, { metodo: "DELETE" });
  db.documentos = db.documentos.filter((d) => d.id !== id);
  guardar();
  return Promise.resolve(null);
}
// --- Equipas e convites ---------------------------------------------------

export const getEquipas = () =>
  USAR_MOCKS ? copia(db.equipas) : pedido("/equipas");

export const getConvites = () =>
  USAR_MOCKS ? copia(db.convites) : pedido("/convites");

// Marca a equipa como "última utilizada"
export function escolherEquipa(id) {
  if (!USAR_MOCKS) return pedido(`/equipas/${id}/escolher`, { metodo: "POST" });
  db.equipas.forEach((e) => { e.ultima = e.id === id; });
  guardar();
  return Promise.resolve(null);
}

export function responderConvite(id, aceitar) {
  if (!USAR_MOCKS) return pedido(`/convites/${id}`, { metodo: "POST", corpo: { aceitar } });
  const convite = db.convites.find((c) => c.id === id);
  if (!convite) return naoEncontrado("Convite");
  db.convites = db.convites.filter((c) => c.id !== id);
  if (aceitar) {
    db.equipas.push({ id: proximoId(db.equipas), nome: convite.equipa, papel: "Membro", membros: 1, projetos: 0, cor: "rosa" });
  }
  guardar();
  return Promise.resolve(null);
}

// Com mocks qualquer código escrito junta a uma equipa de exemplo
export function entrarComConvite(codigo) {
  if (!USAR_MOCKS) return pedido("/convites/entrar", { metodo: "POST", corpo: { codigo } });
  const equipa = { id: proximoId(db.equipas), nome: "Equipa Convidada", papel: "Membro", membros: 2, projetos: 0, cor: "rosa" };
  db.equipas.push(equipa);
  guardar();
  return copia(equipa);
}
