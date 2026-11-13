// Código partilhado por todas as páginas da aplicação.
// Basta incluir <script type="module" src="../js/comum.js"> para a sidebar
// aparecer; as páginas importam daqui as funções de que precisam.
import {
  getUtilizadorAtual,
  tempoReal,
  recusarChamada,
  getNotificacoes,
  marcarNotificacaoLida,
  marcarTodasLidas,
  apagarNotificacao,
  getLembretes,
  getEquipas,
  escolherEquipa,
} from "./api/client.js";

// ==========================================================================
// Formatação (datas, tamanhos, texto seguro)
// ==========================================================================

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MESES_LONGOS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// Escapa texto vindo da API antes de o meter no HTML (evita injeção de código)
export const esc = (texto) =>
  String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const iniciais = (nome) =>
  nome.split(" ").filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();

// "2026-10-15" é lido como data local (new Date("2026-10-15") seria UTC)
export function paraData(valor) {
  if (valor instanceof Date) return valor;
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [a, m, d] = valor.split("-").map(Number);
    return new Date(a, m - 1, d);
  }
  return new Date(valor);
}

// Data local no formato "AAAA-MM-DD"
export function chaveDia(valor) {
  const d = paraData(valor);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const mesAno = (d) => `${MESES_LONGOS[d.getMonth()]} ${d.getFullYear()}`;
export const dataCurta = (v) => { const d = paraData(v); return `${String(d.getDate()).padStart(2, "0")} ${MESES[d.getMonth()]}`; };
export const dataCompleta = (v) => `${dataCurta(v)} ${paraData(v).getFullYear()}`;
export const hora = (v) => paraData(v).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });

function diasAteHoje(v) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const d = paraData(v);
  const dia = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((dia - hoje) / 86400000);
}

export function diaRelativo(v) {
  const dias = diasAteHoje(v);
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Amanhã";
  if (dias === -1) return "Ontem";
  return dataCurta(v);
}

export const intervalo = (inicio, fim) => `${diaRelativo(inicio)}, ${hora(inicio)} – ${hora(fim)}`;

export const estaAtrasada = (prazo) => diasAteHoje(prazo) < 0;

export function horaMensagem(v) {
  const dias = diasAteHoje(v);
  if (dias === 0) return hora(v);
  if (dias === -1) return "Ontem";
  return dataCurta(v);
}

export function tamanhoFicheiro(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function extensao(nome) {
  const partes = nome.split(".");
  return partes.length > 1 ? partes.pop().toUpperCase() : "";
}

// ==========================================================================
// Interface (ícones, avatares, avisos, confirmação)
// ==========================================================================

export const icone = (nome, tamanho, classe = "") =>
  `<img${classe ? ` class="${classe}"` : ""} src="../assets/icons/${nome}" alt="" width="${tamanho}" height="${tamanho}">`;

// tamanho: "sm" (38px), "md" (50px), "lg" (58px)
export function avatar(utilizador, tamanho = "md") {
  if (!utilizador) return "";
  const cor = utilizador.cor && utilizador.cor !== "primaria" ? ` avatar--${utilizador.cor}` : "";
  return `<span class="avatar avatar--${tamanho}${cor}" title="${esc(utilizador.nome)}" aria-hidden="true">${esc(iniciais(utilizador.nome))}</span>`;
}

export const porId = (lista) => new Map(lista.map((x) => [x.id, x]));

// Avatar e nome que abrem o perfil da pessoa
export const linkPerfil = (u, tamanho = "sm") =>
  `<a class="pessoa pessoa--link" href="perfil.html?id=${u.id}">${avatar(u, tamanho)} <span>${esc(u.nome)}</span></a>`;

export function aviso(texto) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("p");
    el.className = "toast";
    el.setAttribute("role", "status");
    document.body.append(el);
  }
  el.textContent = texto;
  el.classList.add("toast--visivel");
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove("toast--visivel"), 3000);
}

// Janela de confirmação com <dialog>; devolve true se o utilizador confirmar
export function confirmar(texto, rotuloConfirmar = "Confirmar") {
  const dialogo = document.createElement("dialog");
  dialogo.className = "dialogo dialogo--pequeno";
  dialogo.innerHTML = `
    <form method="dialog">
      <p class="dialogo__texto">${esc(texto)}</p>
      <div class="dialogo__acoes">
        <button class="botao botao--secundario" value="nao">Cancelar</button>
        <button class="botao botao--perigo" value="sim">${esc(rotuloConfirmar)}</button>
      </div>
    </form>`;
  document.body.append(dialogo);
  dialogo.showModal();
  return new Promise((resolver) => {
    dialogo.addEventListener("close", () => {
      resolver(dialogo.returnValue === "sim");
      dialogo.remove();
    });
  });
}

// Formulário rápido numa janela. campos: [{ nome, rotulo, tipo, opcoes: [[valor, texto]], valor }]
// Devolve { nome: valor, ... } ou null se cancelar.
export function pedirDados(titulo, campos, rotuloBotao = "Guardar") {
  const campoHtml = ({ nome, rotulo, tipo = "text", opcoes = [], valor = "" }) => {
    const id = `campo-${nome}`;
    let controlo = `<input id="${id}" name="${nome}" type="${tipo}" value="${esc(valor)}">`;
    if (tipo === "select") {
      controlo = `<select id="${id}" name="${nome}">${opcoes.map(([v, t]) => `<option value="${esc(v)}"${v === valor ? " selected" : ""}>${esc(t)}</option>`).join("")}</select>`;
    }
    if (tipo === "textarea") controlo = `<textarea id="${id}" name="${nome}" rows="3">${esc(valor)}</textarea>`;
    return `<div class="campo formulario__total"><label for="${id}">${esc(rotulo)}</label>${controlo}</div>`;
  };

  const dialogo = document.createElement("dialog");
  dialogo.className = "dialogo dialogo--pequeno";
  dialogo.innerHTML = `
    <form class="formulario" method="dialog">
      <h2 class="dialogo__titulo formulario__total">${esc(titulo)}</h2>
      ${campos.map(campoHtml).join("")}
      <div class="dialogo__acoes formulario__total">
        <button class="botao botao--secundario" value="nao">Cancelar</button>
        <button class="botao" value="sim">${esc(rotuloBotao)}</button>
      </div>
    </form>`;
  document.body.append(dialogo);
  dialogo.showModal();
  return new Promise((resolver) => {
    dialogo.addEventListener("close", () => {
      const dados = Object.fromEntries(new FormData(dialogo.querySelector("form")));
      resolver(dialogo.returnValue === "sim" ? dados : null);
      dialogo.remove();
    });
  });
}

// ==========================================================================
// Cartão de projeto (Início e Projetos)
// ==========================================================================

export const ESTADOS_PROJETO = {
  em_andamento: { rotulo: "Em andamento", classe: "sucesso" },
  planeamento: { rotulo: "Planeamento", classe: "erro" },
  concluido: { rotulo: "Concluído", classe: "sucesso" },
};

export function cartaoProjeto(p) {
  const estado = ESTADOS_PROJETO[p.estado] ?? ESTADOS_PROJETO.em_andamento;
  const progresso = Number(p.progresso) || 0;
  const cor = p.cor ? ` icone-bloco--${p.cor}` : "";

  return `
    <li>
      <a class="cartao projeto" href="projetos.html?id=${encodeURIComponent(p.id)}">
        <div class="projeto__cabecalho">
          <span class="icone-bloco${cor}">${icone(p.icone, 28)}</span>
          <h3 class="projeto__nome">${esc(p.nome)}</h3>
        </div>
        <span class="etiqueta etiqueta--ponto etiqueta--${estado.classe}">${estado.rotulo}</span>
        <div class="progresso">
          <div class="progresso__trilho" role="progressbar" aria-valuenow="${progresso}" aria-valuemin="0" aria-valuemax="100" aria-label="Progresso de ${esc(p.nome)}">
            <div class="progresso__barra" style="width: ${progresso}%"></div>
          </div>
          <span>${progresso}%</span>
        </div>
        <p class="projeto__rodape">${icone("user.svg", 18)} ${p.tarefasPendentes} ${p.tarefasPendentes === 1 ? "tarefa pendente" : "tarefas pendentes"}</p>
      </a>
    </li>`;
}

// ==========================================================================
// Sidebar
// ==========================================================================

// Caminho relativo a este ficheiro, para funcionar em qualquer página
const asset = (caminho) => new URL(`../assets/${caminho}`, import.meta.url).href;

export const NAV_ITENS = [
  { id: "inicio", rotulo: "Início", pagina: "dashboard.html", icone: "nav-inicio.svg" },
  { id: "tarefas", rotulo: "Tarefas", pagina: "tarefas.html", icone: "nav-tarefas.svg" },
  { id: "projetos", rotulo: "Projetos", pagina: "projetos.html", icone: "nav-projetos.svg" },
  { id: "calendario", rotulo: "Calendário", pagina: "calendario.html", icone: "nav-calendario.svg" },
  { id: "mensagens", rotulo: "Mensagens", pagina: "mensagens.html", icone: "nav-mensagens.svg" },
  { id: "documentos", rotulo: "Documentos", pagina: "documentos.html", icone: "nav-documentos.svg" },
  { id: "reunioes", rotulo: "Reuniões", pagina: "reunioes.html", icone: "nav-reunioes.svg" },
  { id: "turnos", rotulo: "Turnos", pagina: "turnos.html", icone: "nav-turnos.svg" },
];

// Ecrãs extra, numa lista mais compacta por baixo da principal
export const NAV_EXTRA = [
  { id: "assistente", rotulo: "Assistente IA", pagina: "assistente.html", icone: "nav-assistente.svg" },
  { id: "historico", rotulo: "Histórico", pagina: "historico.html", icone: "clock.svg" },
  { id: "administracao", rotulo: "Administração", pagina: "administracao.html", icone: "nav-admin.svg", soAdmin: true },
  { id: "estado", rotulo: "Estado do sistema", pagina: "estado.html", icone: "nav-estado.svg", soAdmin: true },
];

function itemNav(item, ativo, naoLidas) {
  const atual = item.id === ativo ? ' aria-current="page"' : "";
  const badge = naoLidas
    ? `<span class="nav-item__badge" aria-hidden="true"></span><span class="sr-only">(${naoLidas} não lidas)</span>`
    : "";

  return `
    <li>
      <a class="nav-item" href="${item.pagina}"${atual}>
        <img class="nav-item__icone" src="${asset("icons/" + item.icone)}" alt="" width="28" height="28">
        <span>${item.rotulo}</span>
        ${badge}
      </a>
    </li>`;
}

export async function renderSidebar(el) {
  const utilizador = await getUtilizadorAtual();
  const ativo = el.dataset.ativo;
  const admin = utilizador.tipo === "admin";

  // Quem não é administrador não vê nem abre os ecrãs de administração
  if (!admin && NAV_EXTRA.some((item) => item.soAdmin && item.id === ativo)) {
    location.replace("dashboard.html");
    return;
  }

  const itens = NAV_ITENS.map((item) => itemNav(item, ativo, utilizador.naoLidas?.[item.id])).join("");
  const extra = NAV_EXTRA.filter((item) => admin || !item.soAdmin)
    .map((item) => itemNav(item, ativo, utilizador.naoLidas?.[item.id])).join("");

  el.setAttribute("aria-label", "Navegação principal");
  el.innerHTML = `
    <a class="sidebar__marca" href="dashboard.html">
      <img class="sidebar__logo" src="${asset("img/logo-elotask.png")}" alt="" width="43" height="45">
      <span>EloTask</span>
    </a>
    <nav>
      <ul class="sidebar__nav">${itens}</ul>
      <ul class="sidebar__nav sidebar__nav--extra">${extra}</ul>
    </nav>
    <div class="sidebar__conta">
      <a class="sidebar__utilizador" href="perfil.html"${ativo === "perfil" ? ' aria-current="page"' : ""}>
        <span class="avatar" aria-hidden="true">${esc(iniciais(utilizador.nome))}</span>
        <span class="sidebar__textos">
          <span>${esc(utilizador.nome)}</span>
          <span class="sidebar__equipa" data-equipa-atual></span>
        </span>
      </a>
      <button class="sidebar__trocar" type="button" aria-label="Trocar de equipa" aria-expanded="false">
        <img src="${asset("icons/chevron-down.svg")}" alt="" width="16" height="20">
      </button>
    </div>`;

  ligarTrocaEquipa(el);
}

// Seta ao lado do nome: lista curta das equipas para trocar sem sair da página
async function ligarTrocaEquipa(el) {
  const botao = el.querySelector(".sidebar__trocar");
  const equipas = await getEquipas();
  const atual = equipas.find((e) => e.ultima) ?? equipas[0];
  if (atual) el.querySelector("[data-equipa-atual]").textContent = atual.nome;

  const painel = document.createElement("div");
  painel.className = "trocar-equipa";
  painel.hidden = true;
  painel.innerHTML = `
    <p class="trocar-equipa__titulo">Trocar de equipa</p>
    <ul>
      ${equipas.map((e) => `
        <li>
          <button type="button" data-equipa="${e.id}"${e === atual ? ' aria-current="true"' : ""}>
            <span class="trocar-equipa__ponto trocar-equipa__ponto--${esc(e.cor)}" aria-hidden="true"></span>
            ${esc(e.nome)}
          </button>
        </li>`).join("") || '<li class="vazio">Ainda não fazes parte de nenhuma equipa.</li>'}
    </ul>
    <a class="trocar-equipa__todas" href="equipas.html">Ver todas as equipas</a>`;
  document.body.append(painel);

  function abrir(aberto) {
    painel.hidden = !aberto;
    botao.setAttribute("aria-expanded", String(aberto));
    if (!aberto) return;
    // A sidebar corta o que sai dela, por isso a lista fica fixa por cima do botão
    const r = botao.closest(".sidebar__conta").getBoundingClientRect();
    painel.style.left = `${r.left}px`;
    painel.style.bottom = `${innerHeight - r.top + 8}px`;
  }

  botao.addEventListener("click", () => abrir(painel.hidden));
  document.addEventListener("click", (e) => { if (!painel.contains(e.target) && !botao.contains(e.target)) abrir(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") abrir(false); });
  painel.addEventListener("click", async (e) => {
    const escolha = e.target.closest("[data-equipa]");
    if (!escolha) return;
    await escolherEquipa(Number(escolha.dataset.equipa));
    location.reload();
  });
}

// Erros que nenhuma página tratou (ex.: sem permissão no backend) aparecem como aviso
window.addEventListener("unhandledrejection", (e) => {
  if (e.reason?.message) aviso(e.reason.message);
});

// Chamada recebida: aparece em qualquer página, menos na própria página da chamada
async function avisarChamadas() {
  const socket = await tempoReal();
  if (!socket || location.pathname.endsWith("chamada.html")) return;
  socket.on("chamada:recebida", async ({ chamada }) => {
    const atender = await confirmar(`${chamada.nome_iniciador} está a ligar-te.`, "Atender");
    if (atender) location.href = `chamada.html?id=${chamada.id_chamada}`;
    else recusarChamada(chamada.id_chamada);
  });
}

// ==========================================================================
// Notificações: sino fixo no canto superior direito de todas as páginas
// ==========================================================================

function iconeNotificacao(tipo = "") {
  if (tipo.includes("reuniao")) return "meeting.svg";
  if (tipo.includes("prazo") || tipo.includes("lembrete")) return "clock.svg";
  if (tipo.includes("mensagem")) return "task-chat.svg";
  return "calendar-check.svg";
}

const quando = (v) => `${diaRelativo(v)}, ${hora(v)}`;

function iniciarSino() {
  const sino = document.createElement("div");
  sino.className = "sino";
  sino.innerHTML = `
    <button class="sino__botao" type="button" aria-expanded="false" aria-controls="sino-painel" aria-label="Notificações">
      <img src="${asset("icons/bell-28.svg")}" alt="" width="28" height="28">
      <span class="sino__contador" hidden></span>
    </button>
    <p class="sino__alerta" role="status" hidden></p>
    <section class="sino__painel" id="sino-painel" aria-label="Notificações" hidden>
      <header class="sino__topo">
        <h2>Notificações</h2>
        <button class="botao-texto" type="button" data-todas-lidas>Marcar todas como lidas</button>
      </header>
      <ul class="sino__lista" data-notificacoes></ul>
      <div data-bloco-lembretes hidden>
        <h3 class="sino__subtitulo">Lembretes de prazos</h3>
        <ul class="sino__lista" data-lembretes></ul>
      </div>
    </section>`;
  document.body.append(sino);

  const botao = sino.querySelector(".sino__botao");
  const painel = sino.querySelector(".sino__painel");
  const contador = sino.querySelector(".sino__contador");
  const alerta = sino.querySelector(".sino__alerta");

  function mostrarContador(n) {
    contador.hidden = !n;
    contador.textContent = n > 9 ? "9+" : String(n);
    botao.setAttribute("aria-label", n ? `Notificações (${n} por ler)` : "Notificações");
  }

  async function render() {
    const [notificacoes, lembretes] = await Promise.all([getNotificacoes(), getLembretes()]);
    mostrarContador(notificacoes.filter((n) => !n.lida).length);
    if (painel.hidden) return;

    sino.querySelector("[data-notificacoes]").innerHTML = notificacoes.length ? notificacoes.map((n) => `
      <li class="sino__item${n.lida ? "" : " sino__item--por-ler"}">
        <img src="${asset("icons/" + iconeNotificacao(n.tipo))}" alt="" width="22" height="22">
        <div class="sino__texto">
          <p class="sino__titulo">${esc(n.titulo)}${n.lida ? "" : '<span class="sr-only"> (por ler)</span>'}</p>
          <p>${esc(n.mensagem)}</p>
          <p class="sino__quando">${quando(n.criadaEm)}</p>
          <p class="sino__acoes">
            ${n.lida ? "" : `<button class="botao-texto" type="button" data-lida="${n.id}">Marcar como lida</button>`}
            <button class="botao-texto" type="button" data-apagar="${n.id}">Apagar</button>
          </p>
        </div>
      </li>`).join("") : '<li class="vazio">Não tens notificações.</li>';

    sino.querySelector("[data-bloco-lembretes]").hidden = !lembretes.length;
    sino.querySelector("[data-lembretes]").innerHTML = lembretes.map((l) => `
      <li class="sino__item">
        <img src="${asset("icons/clock.svg")}" alt="" width="22" height="22">
        <div class="sino__texto">
          <p class="sino__titulo">${esc(l.mensagem)}</p>
          <p class="sino__quando">${quando(l.quando)}</p>
          <p class="sino__acoes"><a class="botao-texto" href="tarefas.html?tarefa=${l.tarefaId}">Ver tarefa</a></p>
        </div>
      </li>`).join("");
  }

  function abrir(aberto) {
    painel.hidden = !aberto;
    botao.setAttribute("aria-expanded", String(aberto));
    if (aberto) {
      alerta.hidden = true;
      render();
    }
  }

  botao.addEventListener("click", () => abrir(painel.hidden));
  document.addEventListener("click", (e) => { if (!sino.contains(e.target)) abrir(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") abrir(false); });

  painel.addEventListener("click", async (e) => {
    const lida = e.target.closest("[data-lida]");
    const apagar = e.target.closest("[data-apagar]");
    if (lida) await marcarNotificacaoLida(Number(lida.dataset.lida));
    if (apagar) await apagarNotificacao(Number(apagar.dataset.apagar));
    if (e.target.closest("[data-todas-lidas]")) await marcarTodasLidas();
    if (lida || apagar || e.target.closest("[data-todas-lidas]")) await render();
  });

  // Notificação nova em tempo real: aparece por baixo do sino durante uns segundos
  tempoReal().then((socket) => socket?.on("notificacao:nova", (n) => {
    alerta.innerHTML = `<strong>${esc(n.titulo)}</strong> ${esc(n.mensagem)}`;
    alerta.hidden = !painel.hidden;
    clearTimeout(alerta._timer);
    alerta._timer = setTimeout(() => { alerta.hidden = true; }, 6000);
    render();
  })).catch(() => {});

  render().catch(() => {});
}

// Desenha a sidebar e o sino em qualquer página da aplicação
const sidebar = document.querySelector("[data-sidebar]");
if (sidebar) {
  renderSidebar(sidebar);
  avisarChamadas().catch(() => {});
}
if (sidebar || document.querySelector("[data-sino]")) iniciarSino();
