// Janelas (modais) e menu de equipas, partilhados por várias páginas.
//
// Como usar: qualquer botão com data-abrir="nome" abre a janela correspondente:
//   criar-equipa · terminar-sessao · menu-equipas · nova-tarefa
//   carregar-documento · troca-turno · reuniao (precisa também de data-id="1")
//
// Depois de guardar algo, a página recarrega para mostrar os dados novos.
// Uma página pode atualizar-se sozinha: ouve "elotask:dados-alterados" e chama
// evento.preventDefault() (a equipas.js faz isto).
import {
  getUtilizadorAtual, getEquipas, getProjetos, getUtilizadores, getReunioes, getTurnos,
  criarEquipa, escolherEquipa, criarTarefa, carregarDocumento, pedirTrocaTurno,
} from "./api/client.js";
import { esc, iniciais, aviso, paraData, dataCurta, dataCompleta, hora, diaRelativo, tamanhoFicheiro } from "./comum.js";

// CSS das janelas: carregado aqui para as páginas não terem de o incluir
const estilos = document.createElement("link");
estilos.rel = "stylesheet";
estilos.href = new URL("../css/modais.css", import.meta.url).href;
document.head.append(estilos);

// Aviso guardado antes de uma página recarregar (ver atualizar)
try {
  const pendente = sessionStorage.getItem("elotask-aviso");
  if (pendente) {
    sessionStorage.removeItem("elotask-aviso");
    aviso(pendente);
  }
} catch {
  // sem sessionStorage: segue
}

// --- 1. Ícones e pequenas funções auxiliares --------------------------------

const svg = (corpo, t = 20) =>
  `<svg width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${corpo}</svg>`;

const ICONES = {
  x: svg('<path d="M18 6 6 18M6 6l12 12"/>', 16),
  xPequeno: svg('<path d="M18 6 6 18M6 6l12 12"/>', 12),
  upload: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>', 22),
  info: svg('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>', 18),
  calendario: svg('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
  pasta: svg('<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>'),
  pessoa: svg('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
  pessoas: svg('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>'),
  mais: svg('<path d="M12 5v14M5 12h14"/>'),
  visto: svg('<path d="m20 6-11 11-5-5"/>'),
  sair: svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'),
};

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// "Equipa EloTask" → "EE"   |   "Investigação" → "IN"
export function sigla(nome) {
  const palavras = nome.split(" ").filter(Boolean);
  const letras = palavras.length > 1 ? palavras[0][0] + palavras[1][0] : nome.slice(0, 2);
  return letras.toUpperCase();
}

// Campo com rótulo e espaço para a mensagem de erro
const campo = (id, rotulo, controlo) =>
  `<div class="m-campo"><label for="${id}">${rotulo}</label>${controlo}<p class="m-erro" id="erro-${id}"></p></div>`;

const opcoes = (lista, escolhido) =>
  lista.map(([valor, texto]) =>
    `<option value="${esc(valor)}"${String(valor) === String(escolhido) ? " selected" : ""}>${esc(texto)}</option>`).join("");

const acoes = (rotulo) =>
  `<div class="modal__acoes">
     <button class="m-btn m-btn--contorno" type="button" data-fechar>Cancelar</button>
     <button class="m-btn" type="submit">${rotulo}</button>
   </div>`;

// Escreve (ou limpa) o erro de um campo; devolve true se o campo está válido
function erro(d, id, texto) {
  d.querySelector(`#erro-${id}`).textContent = texto;
  d.querySelector(`#${id}`)?.setAttribute("aria-invalid", texto ? "true" : "false");
  return !texto;
}

// Depois de guardar: avisa e atualiza a página
function atualizar(mensagem) {
  const semPreferencia = document.dispatchEvent(new CustomEvent("elotask:dados-alterados", { cancelable: true }));
  if (!semPreferencia) {
    aviso(mensagem); // a página tratou de se atualizar sozinha
    return;
  }
  try {
    sessionStorage.setItem("elotask-aviso", mensagem);
  } catch {
    // sem sessionStorage o aviso perde-se, mas a página atualiza na mesma
  }
  location.reload();
}

// --- 2. A janela em si -------------------------------------------------------
// Devolve uma Promise que termina quando a janela fecha: com o resultado
// (se guardou) ou com null (se cancelou).

function modal({ titulo, subtitulo = "", html, classe = "", aoMontar = () => {} }) {
  return new Promise((resolver) => {
    const d = document.createElement("dialog");
    d.className = `dialogo modal ${classe}`.trim();
    d.setAttribute("aria-labelledby", "modal-titulo");
    d.innerHTML = `
      <div class="modal__conteudo">
        <header class="modal__topo">
          <div>
            <h2 class="modal__titulo" id="modal-titulo">${esc(titulo)}</h2>
            ${subtitulo ? `<p class="modal__sub">${esc(subtitulo)}</p>` : ""}
          </div>
          <button class="modal__fechar" type="button" aria-label="Fechar" data-fechar>${ICONES.x}</button>
        </header>
        ${html}
      </div>`;
    document.body.append(d);

    let resultado = null;
    const fechar = (valor = null) => { resultado = valor; d.close(); };

    d.addEventListener("close", () => { d.remove(); resolver(resultado); }); // Esc também fecha
    d.addEventListener("click", (e) => {
      // e.target === d só acontece ao clicar no fundo escuro, fora da janela
      if (e.target === d || e.target.closest("[data-fechar]")) fechar();
    });

    aoMontar(d, fechar);
    d.showModal();
    (d.querySelector(".m-campo > input, .m-campo > select, .m-campo > textarea, .m-chips input")
      ?? d.querySelector(".m-btn"))?.focus();
  });
}

// Liga o envio do formulário. A função "tratar" valida e devolve:
//   undefined → há erros, a janela fica aberta
//   um valor  → guardado, a janela fecha com esse valor
function aoSubmeter(d, fechar, tratar) {
  const form = d.querySelector("form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const botao = form.querySelector('[type="submit"]');
    botao.disabled = true;
    try {
      const resultado = await tratar(form);
      if (resultado !== undefined) fechar(resultado);
    } catch (err) {
      console.error(err);
      aviso("Não foi possível guardar. Tente novamente.");
    }
    botao.disabled = false;
  });
}

// --- 3. Criar uma nova equipa -----------------------------------------------

function modalCriarEquipa() {
  const emails = [];

  return modal({
    titulo: "Criar uma nova equipa",
    subtitulo: "Dê um nome à equipa e convide os seus colegas.",
    html: `<form class="modal__form" novalidate>
      ${campo("m-nome", "Nome da equipa", '<input id="m-nome" name="nome" type="text" maxlength="60" placeholder="Ex.: Equipa EloTask" autocomplete="off">')}
      ${campo("m-desc", "Descrição (opcional)", '<input id="m-desc" name="descricao" type="text" maxlength="160" placeholder="Para que serve esta equipa?" autocomplete="off">')}
      <div class="m-campo">
        <label for="m-email">Convidar membros por email</label>
        <div class="m-chips" data-chips>
          <input id="m-email" type="text" inputmode="email" placeholder="Adicionar email..." autocomplete="off" aria-describedby="erro-m-email">
        </div>
        <p class="m-nota">Os convidados recebem um convite e entram na equipa ao aceitá-lo.</p>
        <p class="m-erro" id="erro-m-email"></p>
      </div>
      ${acoes("Criar equipa")}
    </form>`,
    aoMontar(d, fechar) {
      const caixa = d.querySelector("[data-chips]");
      const entrada = d.querySelector("#m-email");

      // Desenha os emails já adicionados antes do campo de escrita
      const desenhar = () => {
        caixa.querySelectorAll(".m-chip").forEach((c) => c.remove());
        emails.forEach((mail, i) => entrada.insertAdjacentHTML("beforebegin",
          `<span class="m-chip">${esc(mail)}<button type="button" data-remover="${i}" aria-label="Remover ${esc(mail)}">${ICONES.xPequeno}</button></span>`));
      };

      // Passa o texto escrito a email adicionado; devolve false se for inválido
      const juntar = () => {
        const mail = entrada.value.trim().replace(/[,;]$/, "").toLowerCase();
        if (!mail) return true;
        if (!EMAIL.test(mail)) return erro(d, "m-email", "Introduza um email válido.");
        if (!emails.includes(mail)) emails.push(mail);
        entrada.value = "";
        erro(d, "m-email", "");
        desenhar();
        return true;
      };

      entrada.addEventListener("keydown", (e) => {
        if (["Enter", ",", ";", " "].includes(e.key)) {
          if (entrada.value.trim()) e.preventDefault(); // não envia o formulário
          juntar();
        } else if (e.key === "Backspace" && !entrada.value && emails.length) {
          emails.pop();
          desenhar();
        }
      });
      entrada.addEventListener("blur", juntar);

      caixa.addEventListener("click", (e) => {
        const remover = e.target.closest("[data-remover]");
        if (remover) { emails.splice(Number(remover.dataset.remover), 1); desenhar(); }
        else if (e.target === caixa) entrada.focus();
      });

      aoSubmeter(d, fechar, (f) => {
        const nome = f.nome.value.trim();
        const nomeOk = erro(d, "m-nome", nome ? "" : "Indique o nome da equipa.");
        const emailOk = juntar();
        if (!nomeOk || !emailOk) return undefined;
        return criarEquipa({ nome, descricao: f.descricao.value.trim(), emails });
      });
    },
  });
}

// --- 4. Terminar sessão ------------------------------------------------------

function modalTerminarSessao() {
  return modal({
    titulo: "Terminar sessão?",
    subtitulo: "Terá de iniciar sessão novamente para aceder às suas equipas.",
    classe: "modal--pequeno",
    html: `<form class="modal__form">${acoes("Terminar sessão")}</form>`,
    aoMontar(d, fechar) {
      aoSubmeter(d, fechar, () => {
        location.href = "login.html";
      });
    },
  });
}

// --- 5. Nova tarefa ------------------------------------------------------------

const PRIORIDADES = [["alta", "Alta"], ["media", "Média"], ["baixa", "Baixa"]];

async function modalNovaTarefa() {
  const [projetos, utilizadores, eu] = await Promise.all([getProjetos(), getUtilizadores(), getUtilizadorAtual()]);

  return modal({
    titulo: "Nova tarefa",
    subtitulo: "Crie uma tarefa e atribua-a a um membro da equipa.",
    html: `<form class="modal__form" novalidate>
      ${campo("m-titulo", "Título da tarefa", '<input id="m-titulo" name="titulo" type="text" maxlength="120" placeholder="Ex.: Rever documentação do projeto" autocomplete="off">')}
      <div class="m-linha">
        ${campo("m-projeto", "Projeto", `<select id="m-projeto" name="projetoId">${opcoes(projetos.map((p) => [p.id, p.nome]))}</select>`)}
        ${campo("m-resp", "Responsável", `<select id="m-resp" name="responsavel">${opcoes(utilizadores.map((u) => [u.id, u.nome]), eu.id)}</select>`)}
      </div>
      <div class="m-linha">
        ${campo("m-prazo", "Prazo", '<input id="m-prazo" name="prazo" type="date">')}
        <fieldset class="m-campo">
          <legend>Prioridade</legend>
          <div class="m-pilulas">
            ${PRIORIDADES.map(([v, t]) => `<label class="m-pilula m-pilula--${v}"><input type="radio" name="prioridade" value="${v}"${v === "media" ? " checked" : ""}><span>${t}</span></label>`).join("")}
          </div>
        </fieldset>
      </div>
      ${acoes("Criar tarefa")}
    </form>`,
    aoMontar(d, fechar) {
      aoSubmeter(d, fechar, (f) => {
        const titulo = f.titulo.value.trim();
        const valido = [
          erro(d, "m-titulo", titulo ? "" : "Indique o título da tarefa."),
          erro(d, "m-prazo", f.prazo.value ? "" : "Indique o prazo."),
        ].every(Boolean);
        if (!valido) return undefined;

        return criarTarefa({
          titulo,
          projetoId: Number(f.projetoId.value),
          responsaveis: [Number(f.responsavel.value)],
          prazo: f.prazo.value,
          prioridade: f.prioridade.value,
          estado: "por_fazer",
        });
      });
    },
  });
}

// --- 6. Carregar documento ----------------------------------------------------

const ACESSOS = [["equipa", "Toda a equipa"], ["projeto", "Só o projeto"], ["eu", "Só eu"]];
const EXTENSOES = ["pdf", "docx", "pptx", "xlsx"];
const TAMANHO_MAX = 25 * 1024 * 1024;

async function modalCarregar() {
  const projetos = await getProjetos();

  return modal({
    titulo: "Carregar documento",
    subtitulo: "Adicione um ficheiro a um projeto da equipa.",
    html: `<form class="modal__form" novalidate>
      <div class="m-campo">
        <div>
          <label class="m-drop" data-drop>
            <input class="sr-only" id="m-ficheiro" type="file" accept=".pdf,.docx,.pptx,.xlsx" aria-describedby="erro-m-ficheiro">
            <span class="m-drop__icone">${ICONES.upload}</span>
            <strong data-drop-nome>Arraste um ficheiro para aqui</strong>
            <small data-drop-info>ou clique para procurar · PDF, DOCX, PPTX, XLSX até 25 MB</small>
          </label>
        </div>
        <p class="m-erro" id="erro-m-ficheiro"></p>
      </div>
      ${campo("m-projeto", "Projeto", `<select id="m-projeto" name="projetoId">${opcoes(projetos.map((p) => [p.id, p.nome]))}</select>`)}
      <fieldset class="m-campo">
        <legend>Quem pode aceder</legend>
        <div class="m-pilulas">
          ${ACESSOS.map(([v, t], i) => `<label class="m-pilula"><input type="radio" name="acesso" value="${v}"${i === 0 ? " checked" : ""}><span>${t}</span></label>`).join("")}
        </div>
      </fieldset>
      ${acoes("Carregar")}
    </form>`,
    aoMontar(d, fechar) {
      const entrada = d.querySelector("#m-ficheiro");
      const zona = d.querySelector("[data-drop]");
      let ficheiro = null;

      const escolher = (f) => {
        ficheiro = null;
        if (!f) return;
        if (!EXTENSOES.includes(f.name.split(".").pop().toLowerCase())) { erro(d, "m-ficheiro", "Tipo de ficheiro não suportado."); return; }
        if (f.size > TAMANHO_MAX) { erro(d, "m-ficheiro", "O ficheiro tem mais de 25 MB."); return; }
        erro(d, "m-ficheiro", "");
        ficheiro = f;
        d.querySelector("[data-drop-nome]").textContent = f.name;
        d.querySelector("[data-drop-info]").textContent = `${tamanhoFicheiro(f.size)} · clique para trocar`;
      };

      entrada.addEventListener("change", () => escolher(entrada.files[0]));
      for (const ev of ["dragenter", "dragover"]) {
        zona.addEventListener(ev, (e) => { e.preventDefault(); zona.classList.add("m-drop--sobre"); });
      }
      for (const ev of ["dragleave", "drop"]) {
        zona.addEventListener(ev, () => zona.classList.remove("m-drop--sobre"));
      }
      zona.addEventListener("drop", (e) => { e.preventDefault(); escolher(e.dataTransfer.files[0]); });

      aoSubmeter(d, fechar, (f) => {
        if (!ficheiro) { erro(d, "m-ficheiro", "Escolha um ficheiro."); return undefined; }
        return carregarDocumento({
          nome: ficheiro.name,
          tamanho: ficheiro.size,
          // Nos mocks, projetoId null = documento pessoal (separador "Pessoais")
          projetoId: f.acesso.value === "eu" ? null : Number(f.projetoId.value),
        });
      });
    },
  });
}

// --- 7. Pedir troca de turno -------------------------------------------------

const rotuloTurno = (t) =>
  `${DIAS[paraData(t.inicio).getDay()]} ${dataCurta(t.inicio)} · ${hora(t.inicio)} – ${hora(t.fim)}`;

async function modalTroca() {
  const [turnos, utilizadores, eu] = await Promise.all([getTurnos(), getUtilizadores(), getUtilizadorAtual()]);
  const agora = new Date().toISOString();
  const futuros = turnos.filter((t) => t.fim >= agora);
  const meus = futuros.filter((t) => t.utilizadorId === eu.id);
  const outros = futuros.filter((t) => t.utilizadorId !== eu.id);
  const nome = (id) => utilizadores.find((u) => u.id === id)?.nome ?? "";

  if (!meus.length || !outros.length) {
    aviso("Não há turnos disponíveis para trocar.");
    return null;
  }

  return modal({
    titulo: "Pedir troca de turno",
    subtitulo: "O pedido é validado automaticamente: só é aprovado se a escala resultante cumprir todas as restrições.",
    html: `<form class="modal__form" novalidate>
      ${campo("m-meu", "O meu turno", `<select id="m-meu" name="meu">${opcoes(meus.map((t) => [t.id, rotuloTurno(t)]))}</select>`)}
      ${campo("m-com", "Trocar com", `<select id="m-com" name="com">${opcoes(outros.map((t) => [t.id, `${nome(t.utilizadorId)} · ${rotuloTurno(t)}`]))}</select>`)}
      ${campo("m-motivo", "Motivo (opcional)", '<textarea id="m-motivo" name="motivo" placeholder="Explique brevemente o motivo do pedido..."></textarea>')}
      <p class="m-info">${ICONES.info}<span>O gestor de turnos será notificado quando o pedido for validado.</span></p>
      ${acoes("Enviar pedido")}
    </form>`,
    aoMontar(d, fechar) {
      aoSubmeter(d, fechar, (f) => pedirTrocaTurno({
        turnoId: Number(f.meu.value),
        comTurnoId: Number(f.com.value),
        motivo: f.motivo.value.trim(),
      }));
    },
  });
}

// --- 8. Reunião de equipa (só de leitura) ----------------------------------------

const avatarPequeno = (u) => {
  const cor = u.cor && u.cor !== "primaria" ? ` avatar--${u.cor}` : "";
  return `<span class="avatar avatar--sm${cor}" title="${esc(u.nome)}" aria-hidden="true">${esc(iniciais(u.nome))}</span>`;
};

async function modalReuniao(id) {
  const [reunioes, projetos, utilizadores] = await Promise.all([getReunioes(), getProjetos(), getUtilizadores()]);
  const r = reunioes.find((x) => x.id === Number(id));
  if (!r) { aviso("Reunião não encontrada."); return; }

  const projeto = projetos.find((p) => p.id === r.projetoId);
  const pessoas = r.participantes.map((pid) => utilizadores.find((u) => u.id === pid)).filter(Boolean);

  await modal({
    titulo: r.titulo,
    subtitulo: `${diaRelativo(r.inicio)} · ${DIAS[paraData(r.inicio).getDay()]} ${dataCompleta(r.inicio)}`,
    classe: "modal--pequeno",
    html: `
      <ul class="m-detalhes">
        <li>${ICONES.calendario}<span>${hora(r.inicio)} – ${hora(r.fim)}</span></li>
        <li>${ICONES.pasta}<span>${esc(projeto ? projeto.nome : "Todos os projetos")}</span></li>
        <li>${ICONES.pessoa}<span>${pessoas.length} ${pessoas.length === 1 ? "participante" : "participantes"}</span></li>
      </ul>
      <div class="pilha-avatares">${pessoas.map(avatarPequeno).join("")}</div>
      <div class="modal__acoes">
        <button class="m-btn m-btn--contorno" type="button" data-fechar>Fechar</button>
        <a class="m-btn" href="reunioes.html">Ver reuniões</a>
      </div>`,
  });
}

// --- 9. Menu "Mudar de equipa" (sidebar) -----------------------------------------

let menuAberto = null;

function fecharMenu() {
  menuAberto?.remove();
  menuAberto = null;
  document.querySelector('[data-abrir="menu-equipas"]')?.setAttribute("aria-expanded", "false");
}

async function menuEquipas(botao) {
  if (menuAberto) { fecharMenu(); return; }

  const equipas = await getEquipas();
  const atual = equipas.find((e) => e.ultima) ?? equipas[0];

  const m = document.createElement("div");
  m.className = "menu-eq";
  m.setAttribute("role", "menu");
  m.innerHTML = `
    <p class="menu-eq__rotulo">Mudar de equipa</p>
    ${equipas.map((e) => {
      const ativa = atual && e.id === atual.id;
      return `<button class="menu-eq__item${ativa ? " menu-eq__item--ativo" : ""}" type="button" role="menuitemradio" aria-checked="${ativa}" data-equipa="${e.id}">
        <span class="menu-eq__avatar menu-eq__avatar--${esc(e.cor)}" aria-hidden="true">${esc(sigla(e.nome))}</span>
        <span class="menu-eq__texto"><strong>${esc(e.nome)}</strong><small>${esc(e.papel)} · ${e.membros} ${e.membros === 1 ? "membro" : "membros"}</small></span>
        ${ativa ? `<span class="menu-eq__visto">${ICONES.visto}</span>` : ""}
      </button>`;
    }).join("")}
    <hr class="menu-eq__sep">
    <a class="menu-eq__item menu-eq__item--link" role="menuitem" href="equipas.html">${ICONES.pessoas}<span>Ver todas as equipas</span></a>
    <button class="menu-eq__item menu-eq__item--link" type="button" role="menuitem" data-acao="criar">${ICONES.mais}<span>Criar equipa</span></button>
    <hr class="menu-eq__sep">
    <a class="menu-eq__item menu-eq__item--link" role="menuitem" href="perfil.html">${ICONES.pessoa}<span>O meu perfil</span></a>
    <button class="menu-eq__item menu-eq__item--link" type="button" role="menuitem" data-acao="sair">${ICONES.sair}<span>Terminar sessão</span></button>`;
  document.body.append(m);

  // Aparece logo acima do botão da sidebar
  const r = botao.getBoundingClientRect();
  m.style.left = `${Math.max(8, r.left)}px`;
  m.style.bottom = `${window.innerHeight - r.top + 8}px`;
  botao.setAttribute("aria-expanded", "true");

  // Fecha ao clicar fora ou com Esc
  const ctl = new AbortController();
  document.addEventListener("pointerdown", (e) => {
    if (!m.contains(e.target) && !botao.contains(e.target)) fecharMenu();
  }, { signal: ctl.signal });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { fecharMenu(); botao.focus(); }
  }, { signal: ctl.signal });
  menuAberto = { remove() { ctl.abort(); m.remove(); } };

  m.addEventListener("click", async (e) => {
    const equipa = e.target.closest("[data-equipa]");
    const acao = e.target.closest("[data-acao]")?.dataset.acao;
    if (equipa) {
      await escolherEquipa(Number(equipa.dataset.equipa));
      location.href = "dashboard.html";
    } else if (acao === "criar") {
      fecharMenu();
      if (await modalCriarEquipa()) location.href = "equipas.html";
    } else if (acao === "sair") {
      fecharMenu();
      modalTerminarSessao();
    }
  });
}

// --- 10. Ligação aos botões (data-abrir) -----------------------------------------

const ABRIR = {
  "criar-equipa": async () => { if (await modalCriarEquipa()) atualizar("Equipa criada."); },
  "terminar-sessao": () => modalTerminarSessao(),
  "menu-equipas": (gatilho) => menuEquipas(gatilho),
  "nova-tarefa": async () => { if (await modalNovaTarefa()) atualizar("Tarefa criada."); },
  "carregar-documento": async () => { if (await modalCarregar()) atualizar("Documento carregado."); },
  "troca-turno": async () => { if (await modalTroca()) atualizar("Pedido de troca enviado."); },
  "reuniao": (gatilho) => modalReuniao(gatilho.dataset.id),
};

// Fase de captura: corre antes dos ouvintes da própria página, por isso um botão
// com data-abrir abre sempre a nossa janela (e não uma antiga que a página tenha)
document.addEventListener("click", (e) => {
  const gatilho = e.target.closest("[data-abrir]");
  const abrir = gatilho && ABRIR[gatilho.dataset.abrir];
  if (!abrir) return;
  e.preventDefault();
  e.stopPropagation();
  abrir(gatilho);
}, true);