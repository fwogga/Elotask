// Único sítio onde as páginas vão buscar e guardar dados.
//
// Há dois backends (Node + MySQL, a mesma base de dados):
//  - principal (porta 3000): login, equipas, projetos, tarefas, checklists, turnos,
//    ausências, eventos do calendário, histórico
//  - comunicação (porta 3002): utilizadores, mensagens, canais, chamadas, reuniões,
//    notificações, lembretes, assistente IA
// Documentos ainda não têm API e usam os dados de exemplo guardados no localStorage.
// Cada parte usa o seu backend se ele responder; se não, usa os dados de exemplo.
// As páginas não sabem de onde vêm os dados.
import * as seeds from "../mocks/dados.js";

// "auto": usa os backends que estiverem ligados, senão os dados de exemplo
// "api": usa sempre os backends   |   "mocks": usa sempre os dados de exemplo
const MODO = "auto";
const API_URL = "http://localhost:3002/api";
const API_PRINCIPAL = "http://localhost:3000";
const CHAVE = "elotask-mocks-v2";
const CHAVE_SESSAO = "elotask-sessao";

// --- Ligação aos backends -------------------------------------------------

const disponivel = {};

// Verifica uma vez por página se um backend responde (no modo "auto")
function responde(url) {
  if (MODO === "mocks") return Promise.resolve(false);
  if (MODO === "api") return Promise.resolve(true);
  disponivel[url] ??= fetch(`${url}/health`, { signal: AbortSignal.timeout(1500) })
    .then((r) => r.ok)
    .catch(() => false);
  return disponivel[url];
}

export const usarApi = () => responde(API_URL);
export const usarPrincipal = () => responde(API_PRINCIPAL);

function lerSessao() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_SESSAO)) ?? null;
  } catch {
    return null;
  }
}

function guardarSessao(sessao) {
  try {
    if (sessao) localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
    else localStorage.removeItem(CHAVE_SESSAO);
  } catch {
    // sem localStorage a sessão não sobrevive a um F5
  }
}

async function pedido(rota, { metodo = "GET", corpo, formulario, base = API_URL, keepalive = false } = {}) {
  const sessao = lerSessao();
  const cabecalhos = { Accept: "application/json" };
  // O token serve nos dois backends (mesmo JWT_SECRET); sem token, o modo dev usa x-user-id
  if (sessao?.token) cabecalhos.Authorization = `Bearer ${sessao.token}`;
  else if (sessao?.id) cabecalhos["x-user-id"] = String(sessao.id);
  if (corpo) cabecalhos["Content-Type"] = "application/json";

  const resposta = await fetch(`${base}${rota}`, {
    method: metodo,
    headers: cabecalhos,
    body: formulario ?? (corpo ? JSON.stringify(corpo) : undefined),
    keepalive,
  });
  const json = await resposta.json().catch(() => null);

  if (resposta.status === 401 && !location.pathname.endsWith("login.html")) {
    guardarSessao(null);
    location.href = "login.html";
  }
  if (!resposta.ok) {
    const erro = new Error(json?.erro ?? json?.mensagem ?? `Erro ${resposta.status} em ${rota}`);
    erro.detalhes = json?.detalhes;
    throw erro;
  }
  return json?.dados ?? json;
}

const principal = (rota, opcoes = {}) => pedido(rota, { ...opcoes, base: API_PRINCIPAL });

// O backend usa "AAAA-MM-DD HH:MM:SS" em hora local; as páginas usam ISO
const daBd = (texto) => (texto ? new Date(texto.replace(" ", "T")).toISOString() : null);

function paraBd(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:00`;
}

const CORES_AVATAR = ["primaria", "violeta", "menta", "laranja"];

const pessoaDaApi = (u) => ({
  id: u.id_utilizador,
  nome: u.nome,
  email: u.email,
  telefone: u.telefone,
  funcao: u.cargo || (u.tipo_utilizador === "admin" ? "Administrador" : "Colaborador"),
  tipo: u.tipo_utilizador,
  estado: u.estado,
  cor: CORES_AVATAR[(u.id_utilizador - 1) % CORES_AVATAR.length],
});

// Uma mensagem só com ficheiro é enviada com o nome do ficheiro como texto; aqui esconde-se
const mensagemDaApi = (m) => ({
  id: m.id_mensagem,
  conversaId: m.id_conversa,
  autorId: m.id_remetente,
  texto: m.anexos?.length && m.conteudo === m.anexos[0].nome_ficheiro ? "" : m.conteudo ?? "",
  enviadaEm: daBd(m.data_envio),
  ...(m.anexos?.length ? { anexo: { id: m.anexos[0].id_anexo, nome: m.anexos[0].nome_ficheiro, tamanho: m.anexos[0].tamanho_bytes } } : {}),
});

const reuniaoDaApi = (r) => ({
  id: r.id_reuniao,
  titulo: r.titulo,
  descricao: r.descricao ?? "",
  inicio: daBd(r.data_inicio),
  fim: daBd(r.data_fim),
  local: r.link_reuniao || r.localizacao || "",
  projetoId: null,
  organizadorId: r.id_criador,
  estado: r.estado,
  participantes: (r.participantes ?? []).map((p) => p.id_utilizador),
});

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
    notificacoes: seeds.notificacoes,
    turnos: seeds.turnos,
    pedidosTroca: [],
    conversasIa: [],
  });
}

function carregar() {
  try {
    const guardado = localStorage.getItem(CHAVE);
    // Junta com o estado inicial para não faltarem listas novas
    if (guardado) return { ...estadoInicial(), ...JSON.parse(guardado) };
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

export async function getUtilizadorAtual() {
  if (await usarApi()) {
    const [eu, naoLidas] = await Promise.all([pedido("/utilizadores/eu"), pedido("/notificacoes/nao-lidas")]);
    return { ...pessoaDaApi(eu), naoLidas: { notificacoes: naoLidas.total } };
  }
  const eu = db.utilizadores.find((u) => u.id === db.utilizadorAtualId);
  const totalNaoLidas = Object.values(db.naoLidas).reduce((a, b) => a + b, 0);
  const notificacoes = db.notificacoes.filter((n) => !n.lida).length;
  return copia({ ...eu, naoLidas: { mensagens: totalNaoLidas, notificacoes } });
}

export async function getUtilizadores() {
  if (await usarApi()) return (await pedido("/utilizadores")).map(pessoaDaApi);
  return copia(db.utilizadores);
}

// --- Sessão ---------------------------------------------------------------

// Com palavra-passe usa o login a sério do backend principal. Sem palavra-passe
// (só para testes, AUTH_MODE=dev) entra só com o email. Aceita "ana.silva" sem o @.
export async function iniciarSessao({ identificador, palavra = "" }) {
  const procura = identificador.trim().toLowerCase();
  const email = procura && !procura.includes("@") ? `${procura}@elotask.pt` : procura;

  if (palavra && (await usarPrincipal())) {
    const r = await principal("/autenticacao/login", { metodo: "POST", corpo: { email, password: palavra } });
    guardarSessao({ id: r.utilizador.id_utilizador, token: r.token });
    return pessoaDaApi(r.utilizador);
  }
  if (await usarApi()) {
    const u = await pedido("/auth/entrar", { metodo: "POST", corpo: { email } });
    guardarSessao({ id: u.id_utilizador, token: u.token });
    return pessoaDaApi(u);
  }
  const u = procura && db.utilizadores.find((x) => x.email === procura || x.email.split("@")[0] === procura);
  if (u) {
    db.utilizadorAtualId = u.id;
    guardar();
  }
  return copia(db.utilizadores.find((x) => x.id === db.utilizadorAtualId));
}

// Campos vazios recebem valores por defeito; um email repetido reutiliza a conta
export async function registar({ nome, email, telefone, nascimento }) {
  if (await usarApi()) {
    return pessoaDaApi(await pedido("/auth/registar", { metodo: "POST", corpo: { nome, email, telefone } }));
  }
  const existente = email && db.utilizadores.find((u) => u.email === email);
  if (existente) return copia(existente);
  const id = proximoId(db.utilizadores);
  const novo = {
    id,
    nome: nome || `Utilizador ${id}`,
    email: email || `utilizador${id}@elotask.pt`,
    telefone, nascimento,
    funcao: "Membro",
    tipo: "colaborador",
    estado: "ativo",
    cor: CORES_AVATAR[db.utilizadores.length % CORES_AVATAR.length],
  };
  db.utilizadores.push(novo);
  guardar();
  return copia(novo);
}

export function terminarSessao() {
  guardarSessao(null);
  return Promise.resolve(null);
}

// --- Dashboard ------------------------------------------------------------

export async function getResumo() {
  const [projetos, tarefas, reunioes, pessoas] = await Promise.all([getProjetos(), getTarefas(), getReunioes(), getUtilizadores()]);
  return {
    projetosAtivos: projetos.filter((p) => p.estado !== "concluido").length,
    tarefasPendentes: tarefas.filter((t) => t.estado !== "concluida").length,
    reunioesHoje: reunioes.filter((r) => eHoje(r.inicio)).length,
    membrosEquipa: pessoas.length,
  };
}

// --- Projetos --------------------------------------------------------------

const ESTADO_PROJETO = { em_curso: "em_andamento", planeado: "planeamento", concluido: "concluido", suspenso: "planeamento", cancelado: "concluido" };
const ICONES_PROJETO = ["proj-globe.svg", "proj-mobile.svg", "proj-megafone.svg", "proj-pesquisa.svg"];

function projetoDaApi(p, tarefas, membros = []) {
  const doProjeto = tarefas.filter((t) => t.projetoId === p.id_projeto);
  const concluidas = doProjeto.filter((t) => t.estado === "concluida").length;
  return {
    id: p.id_projeto,
    nome: p.nome,
    descricao: p.descricao ?? "",
    objetivos: [],
    estado: ESTADO_PROJETO[p.estado] ?? "planeamento",
    inicio: p.data_inicio,
    fim: p.data_fim,
    icone: ICONES_PROJETO[(p.id_projeto - 1) % ICONES_PROJETO.length],
    cor: "",
    gestorId: p.id_criador,
    membros,
    progresso: doProjeto.length ? Math.round((concluidas / doProjeto.length) * 100) : 0,
    tarefasPendentes: doProjeto.length - concluidas,
  };
}

export async function getProjetos() {
  if (await usarPrincipal()) {
    const [{ projetos }, tarefas] = await Promise.all([principal("/projetos"), getTarefas()]);
    return projetos.map((p) => projetoDaApi(p, tarefas));
  }
  return copia(db.projetos.map(comProgresso));
}

export async function getProjeto(id) {
  if (await usarPrincipal()) {
    const [{ projeto }, { membros }, tarefas] = await Promise.all([
      principal(`/projetos/${id}`),
      principal(`/projetos/${id}/membros`),
      getTarefas(),
    ]);
    return projetoDaApi(projeto, tarefas, membros.map((m) => m.id_utilizador));
  }
  const projeto = db.projetos.find((p) => p.id === Number(id));
  return projeto ? copia(comProgresso(projeto)) : naoEncontrado("Projeto");
}

// --- Tarefas ---------------------------------------------------------------

// Na base de dados: pendente / em_curso / concluida; no quadro: por_fazer / em_progresso / concluida
const ESTADO_TAREFA = { pendente: "por_fazer", em_curso: "em_progresso", concluida: "concluida" };
const ESTADO_TAREFA_BD = { por_fazer: "pendente", em_progresso: "em_curso", concluida: "concluida" };

// As rotas das tarefas precisam do projeto; guarda-se aqui de que projeto é cada tarefa
const projetoDaTarefa = new Map();

async function tarefasDaApi() {
  const { projetos } = await principal("/projetos");
  const porProjeto = await Promise.all(projetos.map((p) => principal(`/projetos/${p.id_projeto}/tarefas`)));
  const lista = porProjeto.flatMap((r) => r.tarefas).filter((t) => t.estado !== "cancelada");
  const responsaveis = await Promise.all(
    lista.map((t) => principal(`/projetos/${t.id_projeto}/tarefas/${t.id_tarefa}/responsaveis`))
  );
  return lista.map((t, i) => {
    projetoDaTarefa.set(t.id_tarefa, t.id_projeto);
    return {
      id: t.id_tarefa,
      titulo: t.titulo,
      descricao: t.descricao ?? "",
      projetoId: t.id_projeto,
      responsaveis: responsaveis[i].responsaveis.map((r) => r.id_utilizador),
      prazo: t.prazo ?? chaveHoje(),
      prioridade: t.prioridade === "urgente" ? "alta" : t.prioridade,
      estado: ESTADO_TAREFA[t.estado] ?? "por_fazer",
    };
  });
}

function chaveHoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function getTarefas() {
  if (await usarPrincipal()) return tarefasDaApi();
  return copia(db.tarefas);
}

export async function getTarefasRecentes() {
  const pendentes = (await getTarefas())
    .filter((t) => t.estado !== "concluida")
    .sort((a, b) => a.prazo.localeCompare(b.prazo));
  return pendentes.slice(0, 3);
}

async function definirResponsaveis(projetoId, tarefaId, novos, atuais = []) {
  const rota = `/projetos/${projetoId}/tarefas/${tarefaId}/responsaveis`;
  for (const id of novos.filter((x) => !atuais.includes(x))) {
    await principal(rota, { metodo: "POST", corpo: { id_utilizador: id } });
  }
  for (const id of atuais.filter((x) => !novos.includes(x))) {
    await principal(`${rota}/${id}`, { metodo: "DELETE" });
  }
}

export async function criarTarefa(dados) {
  if (await usarPrincipal()) {
    const r = await principal(`/projetos/${dados.projetoId}/tarefas`, {
      metodo: "POST",
      corpo: { titulo: dados.titulo, prioridade: dados.prioridade, prazo: dados.prazo },
    });
    const id = r.id_tarefa ?? r.tarefa?.id_tarefa;
    projetoDaTarefa.set(id, dados.projetoId);
    await definirResponsaveis(dados.projetoId, id, dados.responsaveis ?? []);
    if (dados.estado && dados.estado !== "por_fazer") {
      await principal(`/projetos/${dados.projetoId}/tarefas/${id}/estado`, { metodo: "PUT", corpo: { estado: ESTADO_TAREFA_BD[dados.estado] } });
    }
    return { estado: "por_fazer", ...dados, id };
  }
  const tarefa = { estado: "por_fazer", ...dados, id: proximoId(db.tarefas) };
  db.tarefas.push(tarefa);
  guardar();
  return copia(tarefa);
}

// Mudar de projeto não é possível na API; a tarefa fica no projeto onde foi criada
export async function atualizarTarefa(id, alteracoes) {
  if (await usarPrincipal()) {
    const projetoId = projetoDaTarefa.get(id);
    const base = `/projetos/${projetoId}/tarefas/${id}`;
    if (alteracoes.titulo !== undefined) {
      const { tarefa } = await principal(base);
      await principal(base, {
        metodo: "PUT",
        corpo: { titulo: alteracoes.titulo, descricao: tarefa.descricao, prioridade: alteracoes.prioridade, data_inicio: tarefa.data_inicio, prazo: alteracoes.prazo },
      });
    }
    if (alteracoes.estado) {
      await principal(`${base}/estado`, { metodo: "PUT", corpo: { estado: ESTADO_TAREFA_BD[alteracoes.estado] } });
    }
    if (alteracoes.responsaveis) {
      const { responsaveis } = await principal(`${base}/responsaveis`);
      await definirResponsaveis(projetoId, id, alteracoes.responsaveis, responsaveis.map((r) => r.id_utilizador));
    }
    return { ...alteracoes, id, projetoId };
  }
  const tarefa = db.tarefas.find((t) => t.id === id);
  if (!tarefa) return naoEncontrado("Tarefa");
  Object.assign(tarefa, alteracoes);
  guardar();
  return copia(tarefa);
}

export async function apagarTarefa(id) {
  if (await usarPrincipal()) {
    await principal(`/projetos/${projetoDaTarefa.get(id)}/tarefas/${id}`, { metodo: "DELETE" });
    return null;
  }
  db.tarefas = db.tarefas.filter((t) => t.id !== id);
  guardar();
  return null;
}

// --- Reuniões -------------------------------------------------------------

export async function getReunioes() {
  if (await usarApi()) {
    // A lista não traz os participantes: pede o detalhe de cada reunião
    const lista = await pedido("/reunioes");
    const detalhes = await Promise.all(lista.map((r) => pedido(`/reunioes/${r.id_reuniao}`)));
    return detalhes
      .filter((r) => r.estado !== "cancelada")
      .map(reuniaoDaApi)
      .sort((a, b) => a.inicio.localeCompare(b.inicio));
  }
  return copia([...db.reunioes].sort((a, b) => a.inicio.localeCompare(b.inicio)));
}

export async function getProximasReunioes() {
  const agora = new Date().toISOString();
  return (await getReunioes()).filter((r) => r.fim >= agora).slice(0, 2);
}

export async function criarReuniao(dados) {
  if (await usarApi()) {
    const online = /^https?:\/\//.test(dados.local);
    const eu = lerSessao()?.id;
    const r = await pedido("/reunioes", {
      metodo: "POST",
      corpo: {
        titulo: dados.titulo,
        descricao: dados.descricao,
        data_inicio: paraBd(dados.inicio),
        data_fim: paraBd(dados.fim),
        tipo_reuniao: online ? "online" : "presencial",
        ...(online ? { link_reuniao: dados.local } : { localizacao: dados.local }),
        participantes: dados.participantes.filter((id) => id !== eu),
      },
    });
    return reuniaoDaApi(r);
  }
  const reuniao = { ...dados, id: proximoId(db.reunioes), organizadorId: db.utilizadorAtualId };
  db.reunioes.push(reuniao);
  guardar();
  return copia(reuniao);
}

// --- Mensagens ------------------------------------------------------------

export async function getConversas() {
  if (await usarApi()) {
    const lista = await pedido("/conversas");
    const completas = await Promise.all(lista.map(async (c) => {
      const [detalhe, mensagens] = await Promise.all([
        pedido(`/conversas/${c.id_conversa}`),
        pedido(`/conversas/${c.id_conversa}/mensagens?limite=1`),
      ]);
      const ultima = mensagens.mensagens.at(-1);
      return {
        id: c.id_conversa,
        tipo: c.tipo === "grupo" ? "grupo" : "direta",
        nome: c.nome,
        membros: detalhe.membros.map((m) => m.id_utilizador),
        ultima: ultima ? mensagemDaApi(ultima) : null,
        naoLidas: 0,
      };
    }));
    return completas.sort((a, b) => (b.ultima?.enviadaEm ?? "").localeCompare(a.ultima?.enviadaEm ?? ""));
  }
  const lista = db.conversas.filter((c) => c.membros.includes(db.utilizadorAtualId)).map((c) => {
    const msgs = db.mensagens.filter((m) => m.conversaId === c.id);
    return { ...c, ultima: msgs.at(-1) ?? null, naoLidas: db.naoLidas[c.id] ?? 0 };
  });
  lista.sort((a, b) => (b.ultima?.enviadaEm ?? "").localeCompare(a.ultima?.enviadaEm ?? ""));
  return copia(lista);
}

// canal = true quando o id é de um canal de equipa e não de uma conversa
const rotaMensagens = (id, canal) => `/${canal ? "canais" : "conversas"}/${id}/mensagens`;

export async function getMensagens(conversaId, canal = false) {
  if (await usarApi()) {
    const { mensagens } = await pedido(`${rotaMensagens(conversaId, canal)}?limite=100`);
    return mensagens.map(mensagemDaApi);
  }
  return copia(db.mensagens.filter((m) => m.conversaId === conversaId));
}

// O backend ainda não guarda o que cada pessoa já leu
export async function marcarComoLida(conversaId) {
  if (await usarApi()) return null;
  delete db.naoLidas[conversaId];
  guardar();
  return null;
}

// anexo = { nome, tamanho, ficheiro }; o ficheiro só é enviado com a API
export async function enviarMensagem(conversaId, { texto = "", anexo = null }, canal = false) {
  if (await usarApi()) {
    const m = await pedido(rotaMensagens(conversaId, canal), {
      metodo: "POST",
      corpo: { conteudo: texto || anexo?.nome },
    });
    if (anexo?.ficheiro) {
      const formulario = new FormData();
      formulario.append("ficheiros", anexo.ficheiro);
      await pedido(`/mensagens/${m.id_mensagem}/anexos`, { metodo: "POST", formulario });
      return { ...mensagemDaApi(m), texto: texto, anexo: { nome: anexo.nome, tamanho: anexo.tamanho } };
    }
    return mensagemDaApi(m);
  }
  const mensagem = {
    id: proximoId(db.mensagens),
    conversaId,
    autorId: db.utilizadorAtualId,
    texto,
    enviadaEm: new Date().toISOString(),
    ...(anexo ? { anexo: { nome: anexo.nome, tamanho: anexo.tamanho } } : {}),
  };
  db.mensagens.push(mensagem);
  guardar();
  return copia(mensagem);
}

// --- Documentos (dados de exemplo) ----------------------------------------

export const getDocumentos = () =>
  copia([...db.documentos].sort((a, b) => b.modificadoEm.localeCompare(a.modificadoEm)));

export function carregarDocumento({ nome, tamanho, projetoId = null }) {
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
  const documento = db.documentos.find((d) => d.id === id);
  if (!documento) return naoEncontrado("Documento");
  Object.assign(documento, { nome, modificadoEm: new Date().toISOString() });
  guardar();
  return copia(documento);
}

export function apagarDocumento(id) {
  db.documentos = db.documentos.filter((d) => d.id !== id);
  guardar();
  return Promise.resolve(null);
}

// --- Notificações ---------------------------------------------------------

export async function getNotificacoes() {
  if (await usarApi()) {
    const { notificacoes } = await pedido("/notificacoes?limite=50");
    return notificacoes.map((n) => ({
      id: n.id_notificacao,
      tipo: n.tipo,
      titulo: n.titulo,
      mensagem: n.mensagem,
      lida: Boolean(n.lida),
      criadaEm: daBd(n.data_criacao),
    }));
  }
  return copia([...db.notificacoes].sort((a, b) => b.criadaEm.localeCompare(a.criadaEm)));
}

export async function marcarNotificacaoLida(id) {
  if (await usarApi()) return pedido(`/notificacoes/${id}/lida`, { metodo: "PATCH" });
  const n = db.notificacoes.find((x) => x.id === id);
  if (n) n.lida = true;
  guardar();
  return null;
}

export async function marcarTodasLidas() {
  if (await usarApi()) return pedido("/notificacoes/lidas", { metodo: "PATCH" });
  db.notificacoes.forEach((n) => { n.lida = true; });
  guardar();
  return null;
}

export async function apagarNotificacao(id) {
  if (await usarApi()) return pedido(`/notificacoes/${id}`, { metodo: "DELETE" });
  db.notificacoes = db.notificacoes.filter((n) => n.id !== id);
  guardar();
  return null;
}

// --- Assistente IA --------------------------------------------------------

// Uma conversa por pessoa: usa a mais recente ou cria uma nova
export async function getConversaIa() {
  if (await usarApi()) {
    const conversas = await pedido("/ia/conversas");
    const conversa = conversas[0] ?? (await pedido("/ia/conversas", { metodo: "POST", corpo: {} }));
    const { mensagens } = await pedido(`/ia/conversas/${conversa.id_conversa_ia}/mensagens?limite=100`);
    return {
      id: conversa.id_conversa_ia,
      mensagens: mensagens.map((m) => ({ id: m.id_mensagem_ia, autor: m.tipo_mensagem === "resposta" ? "ia" : "eu", texto: m.conteudo })),
    };
  }
  return copia({ id: 0, mensagens: db.conversasIa });
}

export async function perguntarIa(conversaId, pergunta) {
  if (await usarApi()) {
    const r = await pedido(`/ia/conversas/${conversaId}/mensagens`, { metodo: "POST", corpo: { pergunta } });
    return r.resposta.conteudo;
  }
  const resposta = "Sem o backend ligado o assistente não tem acesso aos dados. Inicia o servidor e tenta outra vez.";
  db.conversasIa.push({ id: db.conversasIa.length + 1, autor: "eu", texto: pergunta }, { id: db.conversasIa.length + 2, autor: "ia", texto: resposta });
  guardar();
  return resposta;
}

// --- Estado do sistema ----------------------------------------------------

async function verificar(nome, url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(3000) });
    const json = await r.json().catch(() => ({}));
    return { nome, ok: r.ok, detalhe: json.mensagem ?? (r.ok ? "Disponível." : `Erro ${r.status}`) };
  } catch {
    return { nome, ok: false, detalhe: "Sem resposta." };
  }
}

export async function getEstadoSistema() {
  const verificacoes = await Promise.all([
    verificar("Backend principal", `${API_PRINCIPAL}/health`),
    verificar("Backend de comunicação", `${API_URL}/health`),
    verificar("Base de dados", `${API_URL}/health/database`),
    verificar("Serviço de IA", `${API_URL}/health/ia`),
  ]);
  const [p, c] = await Promise.all([usarPrincipal(), usarApi()]);
  return { modo: p && c ? "api" : p || c ? "misto" : "mocks", apiUrl: `${API_PRINCIPAL} · ${API_URL}`, verificacoes };
}

// --- Equipas e convites ---------------------------------------------------

const CORES_EQUIPA = ["violeta", "rosa", "escuro"];

export async function getEquipas() {
  if (await usarPrincipal()) {
    const { equipas } = await principal("/equipas");
    const eu = lerSessao()?.id;
    const escolhida = Number(localStorage.getItem("elotask-equipa"));
    const membros = await Promise.all(equipas.map((e) => principal(`/equipas/${e.id_equipa}/membros`)));
    return equipas.map((e, i) => ({
      id: e.id_equipa,
      nome: e.nome,
      papel: membros[i].membros.find((m) => m.id_utilizador === eu)?.funcao ?? "Membro",
      membros: membros[i].total_membros,
      projetos: null,
      cor: CORES_EQUIPA[(e.id_equipa - 1) % CORES_EQUIPA.length],
      ultima: e.id_equipa === escolhida,
    }));
  }
  return copia(db.equipas);
}

// O backend ainda não tem convites
export async function getConvites() {
  if (await usarPrincipal()) return [];
  return copia(db.convites);
}

// Marca a equipa como "última utilizada"
export async function escolherEquipa(id) {
  try {
    localStorage.setItem("elotask-equipa", String(id));
  } catch {
    // sem localStorage não se lembra da escolha
  }
  db.equipas.forEach((e) => { e.ultima = e.id === id; });
  guardar();
  return null;
}

export async function criarEquipa({ nome }) {
  if (await usarPrincipal()) {
    await principal("/equipas", { metodo: "POST", corpo: { nome: nome || "Nova equipa" } });
    return { nome: nome || "Nova equipa" };
  }
  const equipa = { id: proximoId(db.equipas), nome: nome || "Nova equipa", papel: "Gestora", membros: 1, projetos: 0, cor: "violeta" };
  db.equipas.push(equipa);
  guardar();
  return copia(equipa);
}

export function responderConvite(id, aceitar) {
  const convite = db.convites.find((c) => c.id === id);
  if (!convite) return naoEncontrado("Convite");
  db.convites = db.convites.filter((c) => c.id !== id);
  if (aceitar) {
    db.equipas.push({ id: proximoId(db.equipas), nome: convite.equipa, papel: "Membro", membros: 1, projetos: 0, cor: "rosa" });
  }
  guardar();
  return Promise.resolve(null);
}

// Com os dados de exemplo qualquer código junta a uma equipa de exemplo; com o backend não faz nada
export async function entrarComConvite() {
  if (await usarPrincipal()) return null;
  const equipa = { id: proximoId(db.equipas), nome: "Equipa Convidada", papel: "Membro", membros: 2, projetos: 0, cor: "rosa" };
  db.equipas.push(equipa);
  guardar();
  return copia(equipa);
}

// --- Turnos ----------------------------------------------------------------

export async function getTurnos() {
  if (await usarPrincipal()) {
    const { turnos } = await principal("/turnos");
    const colaboradores = await Promise.all(turnos.map((t) => principal(`/turnos/${t.id_turno}/colaboradores`)));
    return turnos
      .map((t, i) => ({
        id: t.id_turno,
        nome: t.nome,
        data: t.data_turno.slice(0, 10),
        inicio: t.hora_inicio.slice(0, 5),
        fim: t.hora_fim.slice(0, 5),
        colaboradores: colaboradores[i].colaboradores.map((c) => c.id_utilizador),
      }))
      .sort((a, b) => (a.data + a.inicio).localeCompare(b.data + b.inicio));
  }
  return copia([...db.turnos].sort((a, b) => (a.data + a.inicio).localeCompare(b.data + b.inicio)));
}

const ESTADOS_PEDIDO = { pendente: "Pendente", aceite: "Aceite", recusado: "Recusado", aprovado: "Aprovado", rejeitado: "Rejeitado", cancelado: "Cancelado" };

export async function getPedidosTroca() {
  if (await usarPrincipal()) {
    const pedidos = await principal("/pedidos-troca-turno/meus-pedidos");
    return pedidos.map((p) => ({
      id: p.id_pedido ?? p.id_pedido_troca ?? p.id,
      turnoId: p.id_turno_solicitante,
      paraTurnoId: p.id_turno_destinatario,
      com: p.nome_destinatario,
      motivo: p.motivo,
      estado: ESTADOS_PEDIDO[p.estado] ?? p.estado,
    }));
  }
  return copia(db.pedidosTroca.map((p) => ({ ...p, estado: ESTADOS_PEDIDO[p.estado] ?? p.estado })));
}

// paraTurnoId e comId: o turno do colega e o colega com quem se quer trocar
export async function pedirTrocaTurno({ turnoId, paraTurnoId, comId, motivo }) {
  if (await usarPrincipal()) {
    return principal("/pedidos-troca-turno", {
      metodo: "POST",
      corpo: { id_turno_solicitante: turnoId, id_turno_destinatario: paraTurnoId, id_destinatario: comId, motivo },
    });
  }
  const pedidoTroca = { id: proximoId(db.pedidosTroca), turnoId, paraTurnoId, comId, motivo, estado: "pendente", autorId: db.utilizadorAtualId };
  db.pedidosTroca.push(pedidoTroca);
  guardar();
  return copia(pedidoTroca);
}

// ==========================================================================
// Funcionalidades só com backend: sem ele as listas vêm vazias
// ==========================================================================

const SERVIDOR = API_URL.replace(/\/api$/, "");
const apenasData = (texto) => (texto ? texto.slice(0, 10) : null);

// --- Canais de equipa ------------------------------------------------------

async function equipaAtual() {
  try {
    const guardada = Number(localStorage.getItem("elotask-equipa"));
    if (guardada) return guardada;
  } catch {
    // sem localStorage usa a primeira equipa
  }
  const { equipas } = await principal("/equipas");
  return equipas[0]?.id_equipa ?? null;
}

export async function getCanais() {
  if (!(await usarApi())) return [];
  const canais = await pedido("/canais");
  return Promise.all(canais.map(async (k) => {
    const [detalhe, { mensagens }] = await Promise.all([
      pedido(`/canais/${k.id_canal}`),
      pedido(`/canais/${k.id_canal}/mensagens?limite=1`),
    ]);
    const ultima = mensagens.at(-1);
    return {
      id: k.id_canal,
      canal: true,
      tipo: "canal",
      nome: k.nome,
      descricao: k.descricao ?? "",
      equipa: k.nome_equipa,
      membros: detalhe.membros.map((m) => m.id_utilizador),
      ultima: ultima ? mensagemDaApi(ultima) : null,
      naoLidas: 0,
    };
  }));
}

export async function criarCanal({ nome, descricao }) {
  const equipa = await equipaAtual();
  if (!equipa) throw new Error("Escolhe primeiro uma equipa.");
  const k = await pedido(`/equipas/${equipa}/canais`, { metodo: "POST", corpo: { nome, descricao } });
  return k.id_canal;
}

// --- Chamadas de vídeo (WebRTC; o servidor só passa a sinalização) ---------

let ligacao = null;

// Socket.IO do backend de comunicação; o próprio servidor serve o cliente
export async function tempoReal() {
  if (!lerSessao() || !(await usarApi())) return null;
  ligacao ??= import(`${SERVIDOR}/socket.io/socket.io.esm.min.js`).then(({ io }) => {
    const sessao = lerSessao();
    return io(SERVIDOR, { auth: sessao?.token ? { token: sessao.token } : { userId: sessao?.id } });
  });
  return ligacao;
}

export const getConfigChamadas = () => pedido("/chamadas/config-webrtc");
export const getChamada = (id) => pedido(`/chamadas/${id}`);
export const entrarChamada = (id) => pedido(`/chamadas/${id}/entrar`, { metodo: "POST" });
export const recusarChamada = (id) => pedido(`/chamadas/${id}/recusar`, { metodo: "POST" });
// keepalive deixa o pedido terminar mesmo que a página esteja a fechar
export const sairChamada = (id) => pedido(`/chamadas/${id}/sair`, { metodo: "POST", keepalive: true });

// Se já houver uma chamada nessa conversa ou reunião, entra nela
export async function comecarChamada({ conversaId = null, reuniaoId = null }) {
  try {
    return await pedido("/chamadas", {
      metodo: "POST",
      corpo: { tipo_chamada: "video", id_conversa: conversaId, id_reuniao: reuniaoId },
    });
  } catch (erro) {
    if (erro.detalhes?.id_chamada) return entrarChamada(erro.detalhes.id_chamada);
    throw erro;
  }
}

export function enviarSinal(socket, dados) {
  return new Promise((resolver, rejeitar) => {
    socket.emit("chamada:sinalizar", dados, (r) => (r?.sucesso ? resolver(r.dados) : rejeitar(new Error(r?.erro ?? "Falha na sinalização."))));
  });
}

// --- Lembretes de prazos ---------------------------------------------------

export async function getLembretes() {
  if (!(await usarApi())) return [];
  return (await pedido("/lembretes")).map((l) => ({
    id: l.id_lembrete,
    tarefaId: l.id_tarefa,
    tipo: l.tipo_lembrete,
    mensagem: l.mensagem,
    quando: daBd(l.data_lembrete),
  }));
}

// --- Eventos do calendário -------------------------------------------------

export async function getEventos(de, ate) {
  if (!(await usarPrincipal())) return [];
  const { calendario } = await principal(`/calendario?data_inicio=${de}&data_fim=${ate}`);
  return calendario.filter((e) => e.origem === "evento").map((e) => ({
    id: e.id,
    titulo: e.titulo,
    descricao: e.descricao ?? "",
    tipo: e.tipo,
    inicio: daBd(e.data_inicio),
    fim: daBd(e.data_fim),
  }));
}

export function criarEvento({ titulo, descricao, inicio, fim, tipo }) {
  return principal("/calendario/eventos", {
    metodo: "POST",
    corpo: { titulo, descricao, data_inicio: paraBd(inicio), data_fim: paraBd(fim), tipo_evento: tipo },
  });
}

export const apagarEvento = (id) => principal(`/calendario/eventos/${id}`, { metodo: "DELETE" });

// --- Pedidos de ausência ---------------------------------------------------

const ausenciaDaApi = (p) => ({
  id: p.id_pedido,
  pessoaId: p.id_utilizador,
  pessoa: p.nome_utilizador,
  tipo: p.tipo_ausencia,
  inicio: apenasData(p.data_inicio),
  fim: apenasData(p.data_fim),
  motivo: p.motivo ?? "",
  estado: p.estado,
});

export async function getAusencias() {
  if (!(await usarPrincipal())) return [];
  return (await principal("/pedidos-ausencia/meus")).pedidos.map(ausenciaDaApi);
}

// Pedidos de toda a gente, para quem aprova (admin)
export async function getAusenciasParaAprovar() {
  if (!(await usarPrincipal())) return [];
  return (await principal("/pedidos-ausencia")).pedidos.map(ausenciaDaApi).filter((p) => p.estado === "pendente");
}

export function pedirAusencia({ tipo, inicio, fim, motivo }) {
  return principal("/pedidos-ausencia", { metodo: "POST", corpo: { tipo_ausencia: tipo, data_inicio: inicio, data_fim: fim, motivo } });
}

export const cancelarAusencia = (id) => principal(`/pedidos-ausencia/${id}/cancelar`, { metodo: "PUT" });
export const decidirAusencia = (id, estado) => principal(`/pedidos-ausencia/${id}/decisao`, { metodo: "PUT", corpo: { estado } });

// --- Turnos: criar e gerar escala (admin) ----------------------------------

export function criarTurno({ nome, data, inicio, fim, vagas }) {
  return principal("/turnos", {
    metodo: "POST",
    corpo: { nome, data_turno: data, hora_inicio: inicio, hora_fim: fim, numero_colaboradores: vagas },
  });
}

// dias: ["segunda", "terca", ...]; a mesma hora em todos os dias escolhidos
export function definirDisponibilidade(pessoaId, dias, inicio, fim) {
  return principal(`/turnos/disponibilidade/${pessoaId}`, {
    metodo: "PUT",
    corpo: { disponibilidades: dias.map((dia) => ({ dia_semana: dia, hora_inicio: inicio, hora_fim: fim })) },
  });
}

// A IA de turnos distribui as pessoas pelos turnos ainda sem ninguém
export function gerarEscala({ inicio, fim }) {
  return principal("/turnos/gerar-escala", { metodo: "POST", corpo: { data_inicio: inicio, data_fim: fim } });
}

// --- Checklists das tarefas ------------------------------------------------

const rotaChecklists = (tarefaId) => `/projetos/${projetoDaTarefa.get(tarefaId)}/tarefas/${tarefaId}/checklists`;

export async function getChecklists(tarefaId) {
  if (!(await usarPrincipal()) || !projetoDaTarefa.has(tarefaId)) return [];
  const { checklists } = await principal(rotaChecklists(tarefaId));
  return Promise.all(checklists.map(async (c) => {
    const { itens } = await principal(`${rotaChecklists(tarefaId)}/${c.id_checklist}/itens`);
    return {
      id: c.id_checklist,
      titulo: c.titulo,
      itens: itens.map((i) => ({ id: i.id_item, texto: i.descricao, feito: i.estado === "feito" })),
    };
  }));
}

export async function criarChecklist(tarefaId, titulo) {
  return principal(rotaChecklists(tarefaId), { metodo: "POST", corpo: { titulo } });
}

export async function criarItemChecklist(tarefaId, checklistId, texto) {
  return principal(`${rotaChecklists(tarefaId)}/${checklistId}/itens`, { metodo: "POST", corpo: { descricao: texto } });
}

export async function marcarItemChecklist(tarefaId, checklistId, itemId, feito) {
  return principal(`${rotaChecklists(tarefaId)}/${checklistId}/itens/${itemId}/estado`, {
    metodo: "PUT",
    corpo: { estado: feito ? "feito" : "por_fazer" },
  });
}

// --- Histórico de alterações -----------------------------------------------

export async function getHistorico() {
  if (!(await usarPrincipal())) return [];
  return (await principal("/historico")).historico.map((h) => ({
    id: h.id_alteracao,
    pessoa: h.nome_utilizador,
    projeto: h.nome_projeto,
    tipo: h.tipo_alteracao,
    descricao: h.descricao,
    quando: daBd(h.data_alteracao),
  }));
}

// --- Reuniões: estado, resumo e decisões -----------------------------------

export const alterarEstadoReuniao = (id, estado) => pedido(`/reunioes/${id}/estado`, { metodo: "PATCH", corpo: { estado } });

const decisaoDaApi = (d) => ({
  id: d.id_decisao,
  texto: d.descricao,
  responsavel: d.nome_responsavel,
  estado: d.estado_validacao,
});

export async function getResumos(reuniaoId) {
  if (!(await usarApi())) return { resumos: [], decisoes: [] };
  const r = await pedido(`/ia/reunioes/${reuniaoId}/resumos`);
  return {
    resumos: r.resumos.map((x) => ({ id: x.id_resumo, texto: x.conteudo_resumo, quando: daBd(x.data_geracao) })),
    decisoes: r.decisoes.map(decisaoDaApi),
  };
}

// notas = o que se falou na reunião (pelo menos 20 caracteres)
export const gerarResumo = (reuniaoId, notas) => pedido(`/ia/reunioes/${reuniaoId}/resumo`, { metodo: "POST", corpo: { texto: notas } });
export const validarDecisao = (id, estado) => pedido(`/ia/decisoes/${id}`, { metodo: "PATCH", corpo: { estado_validacao: estado } });

// --- Sugestões da IA para um projeto ---------------------------------------

function sugestoesDaApi(r) {
  return [
    ...r.sugestoes.map((s) => ({ id: s.id_sugestao, organizacao: false, texto: s.descricao, motivo: s.justificacao, estado: s.estado })),
    ...r.organizacao.map((s) => ({
      id: s.id_sugestao,
      organizacao: true,
      texto: `${s.titulo_tarefa}: prioridade ${s.prioridade_atual} → ${s.prioridade_sugerida}${s.prazo_sugerido ? `, prazo ${s.prazo_sugerido}` : ""}`,
      motivo: s.justificacao,
      estado: s.estado,
    })),
  ];
}

export async function getSugestoes(projetoId) {
  if (!(await usarApi())) return [];
  return sugestoesDaApi(await pedido(`/ia/projetos/${projetoId}/sugestoes`));
}

export async function gerarSugestoes(projetoId) {
  return sugestoesDaApi(await pedido(`/ia/projetos/${projetoId}/sugestoes`, { metodo: "POST" }));
}

export function responderSugestao({ id, organizacao }, estado) {
  return pedido(`/ia/${organizacao ? "sugestoes-organizacao" : "sugestoes"}/${id}`, { metodo: "PATCH", corpo: { estado } });
}
