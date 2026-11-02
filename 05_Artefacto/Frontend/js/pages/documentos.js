import {
  getDocumentos,
  getProjetos,
  getUtilizadorAtual,
  carregarDocumento,
  renomearDocumento,
  apagarDocumento,
} from "../api/client.js";
import { esc, dataCompleta, extensao, tamanhoFicheiro, porId, aviso, confirmar } from "../comum.js";

const DIAS_RECENTES = 7;
const TIPOS = {
  PDF: { classe: "", glifo: "glifo-pdf.svg" },
  DOC: { classe: "doc", glifo: "glifo-docx.svg" },
  DOCX: { classe: "doc", glifo: "glifo-docx.svg" },
  PPT: { classe: "ppt", glifo: "glifo-pptx.svg" },
  PPTX: { classe: "ppt", glifo: "glifo-pptx.svg" },
  XLS: { classe: "xls", glifo: "glifo-xlsx.svg" },
  XLSX: { classe: "xls", glifo: "glifo-xlsx.svg" },
};

const estado = { documentos: [], projetos: new Map(), eu: null, separador: "todos", texto: "", pendentes: [], renomearId: null };

const linhas = document.querySelector("[data-linhas]");
const inputFicheiro = document.querySelector("[data-ficheiro]");
const dialogoCarregar = document.querySelector("[data-dialogo-carregar]");
const dialogoNome = document.querySelector("[data-dialogo-nome]");
const formNome = document.querySelector("[data-form-nome]");

// --- Tabela ---------------------------------------------------------------

function filtrar(d) {
  if (estado.texto && !d.nome.toLowerCase().includes(estado.texto)) return false;
  if (estado.separador === "projetos") return d.projetoId !== null;
  if (estado.separador === "pessoais") return d.projetoId === null;
  if (estado.separador === "recentes") return Date.now() - new Date(d.modificadoEm) < DIAS_RECENTES * 86400000;
  return true;
}

function linha(d) {
  const ext = extensao(d.nome);
  const tipo = TIPOS[ext] ?? { classe: "outro", glifo: "glifo-docx.svg" };
  const projeto = d.projetoId ? estado.projetos.get(d.projetoId)?.nome : "Pessoal";

  return `
    <tr>
      <td>
        <div class="documento">
          <span class="documento__icone${tipo.classe ? ` documento__icone--${tipo.classe}` : ""}">
            <img src="../assets/icons/${tipo.glifo}" alt="" width="30" height="30">
          </span>
          <div>
            <p class="documento__nome">${esc(d.nome)}</p>
            <p class="documento__tamanho">${tamanhoFicheiro(d.tamanho)}</p>
          </div>
        </div>
      </td>
      <td>${esc(projeto ?? "")}</td>
      <td class="documento__tipo">${ext || "—"}</td>
      <td>${dataCompleta(d.modificadoEm)}</td>
      <td>
        <div class="menu">
          <button class="botao-menu" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Opções de ${esc(d.nome)}" data-menu="${d.id}">
            <img src="../assets/icons/menu-vertical.svg" alt="" width="8" height="24">
          </button>
          <div class="menu__lista" hidden>
            <button class="menu__item" type="button" data-acao="renomear" data-id="${d.id}">Mudar nome</button>
            <button class="menu__item menu__item--perigo" type="button" data-acao="apagar" data-id="${d.id}">Apagar</button>
          </div>
        </div>
      </td>
    </tr>`;
}

function render() {
  const visiveis = estado.documentos.filter(filtrar);
  linhas.innerHTML = visiveis.length
    ? visiveis.map(linha).join("")
    : '<tr><td colspan="5" class="vazio">Nenhum documento encontrado.</td></tr>';
}

// --- Menu de opções -------------------------------------------------------

function fecharMenus() {
  document.querySelectorAll(".menu__lista").forEach((m) => (m.hidden = true));
  document.querySelectorAll("[data-menu]").forEach((b) => b.setAttribute("aria-expanded", "false"));
}

async function executar(acao, id) {
  const doc = estado.documentos.find((d) => d.id === id);
  fecharMenus();

  if (acao === "renomear") {
    estado.renomearId = id;
    formNome.nome.value = doc.nome;
    document.getElementById("erro-novo-nome").textContent = "";
    dialogoNome.showModal();
    // Seleciona o nome sem a extensão, como no explorador de ficheiros
    const ponto = doc.nome.lastIndexOf(".");
    formNome.nome.setSelectionRange(0, ponto > 0 ? ponto : doc.nome.length);
  }

  if (acao === "apagar" && (await confirmar(`Apagar "${doc.nome}"? Esta ação não pode ser desfeita.`, "Apagar"))) {
    await apagarDocumento(id);
    estado.documentos = estado.documentos.filter((d) => d.id !== id);
    render();
    aviso("Documento apagado.");
  }
}

// --- Carregar -------------------------------------------------------------

function abrirCarregar(ficheiros) {
  estado.pendentes = [...ficheiros];
  const nomes = estado.pendentes.map((f) => f.name).join(", ");
  document.querySelector("[data-ficheiros-escolhidos]").textContent =
    estado.pendentes.length === 1 ? nomes : `${estado.pendentes.length} ficheiros: ${nomes}`;
  dialogoCarregar.showModal();
}

// Nos mocks só guardamos o nome e o tamanho; com a API real o ficheiro é enviado
async function confirmarCarregar(e) {
  e.preventDefault();
  const projetoId = Number(e.target.projetoId.value) || null;
  for (const f of estado.pendentes) {
    estado.documentos.unshift(await carregarDocumento({ nome: f.name, tamanho: f.size, projetoId }));
  }
  aviso(estado.pendentes.length === 1 ? "Documento carregado." : `${estado.pendentes.length} documentos carregados.`);
  estado.pendentes = [];
  inputFicheiro.value = "";
  dialogoCarregar.close();
  render();
}

// --- Arranque -------------------------------------------------------------

function ativarSeparadores() {
  const separadores = [...document.querySelectorAll("[data-separador]")];
  const escolher = (alvo) => {
    for (const s of separadores) {
      s.setAttribute("aria-selected", String(s === alvo));
      s.tabIndex = s === alvo ? 0 : -1;
    }
    document.getElementById("tabela-documentos").setAttribute("aria-labelledby", alvo.id);
    estado.separador = alvo.dataset.separador;
    render();
  };

  for (const [i, s] of separadores.entries()) {
    s.addEventListener("click", () => escolher(s));
    s.addEventListener("keydown", (e) => {
      const passo = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!passo) return;
      const outro = separadores[(i + passo + separadores.length) % separadores.length];
      escolher(outro);
      outro.focus();
    });
  }
}

function ligarEventos() {
  document.querySelector("[data-pesquisa]").addEventListener("submit", (e) => e.preventDefault());
  document.getElementById("pesquisa").addEventListener("input", (e) => {
    estado.texto = e.target.value.trim().toLowerCase();
    render();
  });

  document.querySelector("[data-carregar]").addEventListener("click", () => inputFicheiro.click());
  inputFicheiro.addEventListener("change", () => {
    if (inputFicheiro.files.length) abrirCarregar(inputFicheiro.files);
  });
  document.querySelector("[data-form-carregar]").addEventListener("submit", confirmarCarregar);

  formNome.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = formNome.nome.value.trim();
    if (!nome) {
      document.getElementById("erro-novo-nome").textContent = "O nome não pode ficar vazio.";
      return;
    }
    const atualizado = await renomearDocumento(estado.renomearId, nome);
    Object.assign(estado.documentos.find((d) => d.id === estado.renomearId), atualizado);
    dialogoNome.close();
    render();
    aviso("Nome alterado.");
  });

  for (const botao of document.querySelectorAll("dialog [data-cancelar]")) {
    botao.addEventListener("click", () => botao.closest("dialog").close());
  }

  linhas.addEventListener("click", (e) => {
    const acao = e.target.closest("[data-acao]");
    if (acao) return executar(acao.dataset.acao, Number(acao.dataset.id));

    const botao = e.target.closest("[data-menu]");
    if (!botao) return;
    const lista = botao.nextElementSibling;
    const abrir = lista.hidden;
    fecharMenus();
    lista.hidden = !abrir;
    botao.setAttribute("aria-expanded", String(abrir));
    if (abrir) lista.querySelector("button").focus();
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".menu")) fecharMenus();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharMenus();
  });
}

async function iniciar() {
  const [documentos, projetos, eu] = await Promise.all([getDocumentos(), getProjetos(), getUtilizadorAtual()]);
  estado.documentos = documentos;
  estado.projetos = porId(projetos);
  estado.eu = eu;

  document.getElementById("carregar-projeto").insertAdjacentHTML(
    "beforeend",
    projetos.map((p) => `<option value="${p.id}">${esc(p.nome)}</option>`).join("")
  );

  ativarSeparadores();
  ligarEventos();
  render();
}

iniciar().catch((erro) => {
  console.error(erro);
  linhas.innerHTML = '<tr><td colspan="5" class="erro-carregar" role="alert">Não foi possível carregar os documentos. Tenta novamente.</td></tr>';
});
