import {
  getConversas,
  getMensagens,
  getUtilizadores,
  getUtilizadorAtual,
  marcarComoLida,
  enviarMensagem,
  getCanais,
  criarCanal,
  usarApi,
} from "../api/client.js";
import { renderSidebar, esc, hora, horaMensagem, diaRelativo, chaveDia, tamanhoFicheiro, extensao, avatar, porId, pedirDados } from "../comum.js";

// Conversas e canais estão na mesma lista; a chave ("c3" ou "k3") distingue-os
const estado = { conversas: [], pessoas: new Map(), eu: null, ativa: null, filtro: "" };
const chave = (c) => `${c.canal ? "k" : "c"}${c.id}`;
const ativa = () => estado.conversas.find((c) => chave(c) === estado.ativa);

const lista = document.querySelector("[data-conversas]");
const caixa = document.querySelector("[data-mensagens]");
const compositor = document.querySelector("[data-compositor]");

const TIPOS_ANEXO = { DOC: "doc", DOCX: "doc", PPT: "ppt", PPTX: "ppt", XLS: "xls", XLSX: "xls" };

// --- Ajudas ---------------------------------------------------------------

const outroMembro = (c) => estado.pessoas.get(c.membros.find((id) => id !== estado.eu.id));

function nomeConversa(c) {
  if (c.canal) return `# ${c.nome}`;
  return c.tipo === "grupo" ? c.nome : outroMembro(c)?.nome ?? "Conversa";
}

function avatarConversa(c, tamanho = "xl") {
  if (c.tipo !== "direta") {
    return '<span class="avatar-grupo" aria-hidden="true"><img src="../assets/icons/equipa.svg" alt=""></span>';
  }
  return avatar(outroMembro(c), tamanho);
}

function previa(c) {
  const m = c.ultima;
  if (!m) return "Sem mensagens";
  const texto = m.texto || `📎 ${m.anexo?.nome ?? "Anexo"}`;
  if (c.tipo === "direta") return texto;
  const autor = m.autorId === estado.eu.id ? "Tu" : estado.pessoas.get(m.autorId)?.nome.split(" ")[0];
  return `${autor}: ${texto}`;
}

// --- Lista de conversas ----------------------------------------------------

function renderLista() {
  const visiveis = estado.conversas.filter((c) => nomeConversa(c).toLowerCase().includes(estado.filtro));

  lista.innerHTML = visiveis.length ? visiveis.map((c) => `
    <li>
      <button class="conversa" type="button" data-conversa="${chave(c)}" aria-current="${chave(c) === estado.ativa}">
        ${avatarConversa(c)}
        <span class="conversa__texto">
          <span class="conversa__nome">${esc(nomeConversa(c))}</span>
          <span class="conversa__hora">${c.ultima ? horaMensagem(c.ultima.enviadaEm) : ""}</span>
          <span class="conversa__previa">${esc(previa(c))}</span>
          ${c.naoLidas ? `<span class="conversa__badge">${c.naoLidas}<span class="sr-only"> por ler</span></span>` : ""}
        </span>
      </button>
    </li>`).join("") : '<li class="vazio">Nenhuma conversa encontrada.</li>';
}

// --- Conversa aberta ------------------------------------------------------

function htmlAnexo(anexo) {
  const tipo = TIPOS_ANEXO[extensao(anexo.nome)];
  const glifo = { doc: "glifo-docx.svg", ppt: "glifo-pptx.svg", xls: "glifo-xlsx.svg" }[tipo] ?? "glifo-pdf.svg";
  return `
    <div class="anexo">
      <span class="anexo__icone${tipo ? ` anexo__icone--${tipo}` : ""}"><img src="../assets/icons/${glifo}" alt="" width="36" height="36"></span>
      <div>
        <p class="anexo__nome">${esc(anexo.nome)}</p>
        <p class="anexo__tamanho">${tamanhoFicheiro(anexo.tamanho)}</p>
      </div>
    </div>`;
}

function htmlMensagem(m) {
  const autor = estado.pessoas.get(m.autorId);
  return `
    <li class="mensagem">
      ${avatar(autor, "lg")}
      <p class="mensagem__autor">${esc(autor?.nome ?? "")} <time class="mensagem__hora" datetime="${m.enviadaEm}">${hora(m.enviadaEm)}</time></p>
      ${m.texto ? `<p class="mensagem__balao">${esc(m.texto)}</p>` : ""}
      ${m.anexo ? htmlAnexo(m.anexo) : ""}
    </li>`;
}

async function renderConversa() {
  const c = ativa();
  const mensagens = await getMensagens(c.id, c.canal);

  document.querySelector("[data-conversa-avatar]").innerHTML = avatarConversa(c, "lg");
  document.querySelector("[data-conversa-nome]").textContent = nomeConversa(c);
  document.querySelector("[data-conversa-info]").textContent = c.tipo === "direta"
    ? outroMembro(c)?.funcao ?? ""
    : `${c.membros.length} membros${c.canal ? ` · ${c.equipa}` : ""}`;

  // As videochamadas são só para conversas (o backend não as tem em canais)
  const ligar = document.querySelector("[data-chamada]");
  ligar.hidden = c.canal || !(await usarApi());
  ligar.href = `chamada.html?conversa=${c.id}`;

  // Separador com o dia sempre que muda de dia
  let diaAnterior = "";
  caixa.innerHTML = mensagens.map((m) => {
    const dia = chaveDia(m.enviadaEm);
    const separador = dia !== diaAnterior ? `<li class="mensagens__dia">${diaRelativo(m.enviadaEm)}</li>` : "";
    diaAnterior = dia;
    return separador + htmlMensagem(m);
  }).join("") || '<li class="vazio">Ainda não há mensagens. Diz olá!</li>';
  caixa.scrollTop = caixa.scrollHeight;
}

async function abrirConversa(id) {
  estado.ativa = id;
  history.replaceState(null, "", `?c=${id}`);

  const c = ativa();
  if (c.naoLidas) {
    await marcarComoLida(c.id);
    c.naoLidas = 0;
    renderSidebar(document.querySelector("[data-sidebar]"));
  }
  renderLista();
  await renderConversa();
}

async function enviar(dados) {
  const c = ativa();
  const mensagem = await enviarMensagem(c.id, dados, c.canal);
  c.ultima = mensagem;
  estado.conversas.sort((a, b) => (b.ultima?.enviadaEm ?? "").localeCompare(a.ultima?.enviadaEm ?? ""));
  renderLista();
  await renderConversa();
}

// --- Arranque -------------------------------------------------------------

function ligarEventos() {
  lista.addEventListener("click", (e) => {
    const botao = e.target.closest("[data-conversa]");
    if (botao) abrirConversa(botao.dataset.conversa);
  });

  document.querySelector("[data-novo-canal]").addEventListener("click", async () => {
    const dados = await pedirDados("Novo canal", [
      { nome: "nome", rotulo: "Nome do canal" },
      { nome: "descricao", rotulo: "Descrição", tipo: "textarea" },
    ], "Criar canal");
    if (!dados) return;
    const id = await criarCanal(dados);
    estado.conversas = [...(await getCanais()), ...estado.conversas.filter((c) => !c.canal)];
    await abrirConversa(`k${id}`);
  });

  document.querySelector("[data-pesquisa]").addEventListener("submit", (e) => e.preventDefault());
  document.getElementById("pesquisa").addEventListener("input", (e) => {
    estado.filtro = e.target.value.trim().toLowerCase();
    renderLista();
  });

  compositor.addEventListener("submit", async (e) => {
    e.preventDefault();
    const texto = compositor.mensagem.value.trim();
    if (!texto) return;
    compositor.mensagem.value = "";
    await enviar({ texto });
    compositor.mensagem.focus();
  });

  // Nos mocks só se guarda o nome e o tamanho; com a API o ficheiro é enviado
  document.querySelector("[data-anexo]").addEventListener("change", async (e) => {
    const ficheiro = e.target.files[0];
    if (!ficheiro) return;
    await enviar({ texto: compositor.mensagem.value.trim(), anexo: { nome: ficheiro.name, tamanho: ficheiro.size, ficheiro } });
    compositor.mensagem.value = "";
    e.target.value = "";
  });
}

async function iniciar() {
  const [conversas, canais, pessoas, eu] = await Promise.all([getConversas(), getCanais(), getUtilizadores(), getUtilizadorAtual()]);
  estado.conversas = [...canais, ...conversas];
  estado.pessoas = porId(pessoas);
  estado.eu = eu;

  ligarEventos();
  document.querySelector("[data-novo-canal]").hidden = !(await usarApi());
  // Links antigos usam ?c=3 (só o número da conversa)
  let pedida = new URLSearchParams(location.search).get("c") ?? "";
  if (/^\d+$/.test(pedida)) pedida = `c${pedida}`;
  const inicial = estado.conversas.find((c) => chave(c) === pedida) ?? conversas[0] ?? canais[0];
  if (inicial) await abrirConversa(chave(inicial));
  else renderLista();
}

iniciar().catch((erro) => {
  console.error(erro);
  document.querySelector(".conteudo").insertAdjacentHTML(
    "beforeend",
    '<p class="erro-carregar" role="alert">Não foi possível carregar as mensagens. Tenta novamente.</p>'
  );
});
