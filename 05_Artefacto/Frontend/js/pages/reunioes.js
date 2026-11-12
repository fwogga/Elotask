import {
  getReunioes,
  getProjetos,
  getUtilizadores,
  getUtilizadorAtual,
  criarReuniao,
  usarApi,
  alterarEstadoReuniao,
  getResumos,
  gerarResumo,
  validarDecisao,
} from "../api/client.js";
import { esc, intervalo, dataCurta, hora, chaveDia, avatar, porId, aviso } from "../comum.js";

const MAX_AVATARES = 3;
const lista = document.querySelector("[data-lista]");
const dialogo = document.querySelector("[data-dialogo-agendar]");
const form = document.querySelector("[data-form]");
const escolhidos = document.querySelector("[data-escolhidos]");
const adicionar = document.querySelector("[data-adicionar]");

const dados = { reunioes: [], projetos: new Map(), pessoas: new Map(), eu: null };
const estado = { separador: "proximas", participantes: [] };

// --- Lista de reuniões ----------------------------------------------------

function quando(r) {
  // Reuniões passadas mostram a data, porque "Ontem" deixa de fazer sentido depressa
  return new Date(r.fim) < new Date()
    ? `${dataCurta(r.inicio)}, ${hora(r.inicio)} – ${hora(r.fim)}`
    : intervalo(r.inicio, r.fim);
}

function local(texto) {
  if (!texto) return "";
  const conteudo = /^https?:\/\//.test(texto)
    ? `<a href="${esc(texto)}" target="_blank" rel="noopener">${esc(texto)}</a>`
    : esc(texto);
  return `<p class="reuniao-linha__local">${conteudo}</p>`;
}

function linha(r) {
  const pessoas = r.participantes.map((id) => dados.pessoas.get(id)).filter(Boolean);
  const extra = pessoas.length - MAX_AVATARES;
  const projeto = r.projetoId ? dados.projetos.get(r.projetoId)?.nome : "Todos os projetos";

  return `
    <li class="reuniao-linha">
      <span class="reuniao-linha__icone"><img src="../assets/icons/calendar-days.svg" alt="" width="32" height="32"></span>
      <div>
        <h2 class="reuniao-linha__titulo"><button class="reuniao-linha__abrir" type="button" data-abrir="${r.id}">${esc(r.titulo)}</button></h2>
        <p class="reuniao-linha__quando">${quando(r)}</p>
        ${local(r.local)}
      </div>
      <p class="reuniao-linha__projeto">
        <img src="../assets/icons/folder.svg" alt="" width="24" height="24"> ${esc(projeto ?? "")}
      </p>
      <p class="reuniao-linha__participantes">
        <span class="pilha-avatares" title="${esc(pessoas.map((p) => p.nome).join(", "))}">
          ${pessoas.slice(0, MAX_AVATARES).map((p) => avatar(p, "sm")).join("")}
          ${extra > 0 ? `<span class="avatar avatar--sm avatar--mais" aria-hidden="true">+${extra}</span>` : ""}
        </span>
        ${pessoas.length} participantes
      </p>
    </li>`;
}

function renderLista() {
  const agora = new Date().toISOString();
  const escolhidas = estado.separador === "passadas"
    ? dados.reunioes.filter((r) => r.fim < agora).reverse()
    : dados.reunioes.filter((r) => r.fim >= agora);

  lista.innerHTML = escolhidas.length
    ? escolhidas.map(linha).join("")
    : `<li class="vazio">${estado.separador === "passadas" ? "Ainda não houve reuniões." : "Sem reuniões marcadas."}</li>`;
}

function ativarSeparadores() {
  const separadores = [...document.querySelectorAll("[data-separador]")];
  const escolher = (alvo) => {
    for (const s of separadores) {
      s.setAttribute("aria-selected", String(s === alvo));
      s.tabIndex = s === alvo ? 0 : -1;
    }
    lista.setAttribute("aria-labelledby", alvo.id);
    estado.separador = alvo.dataset.separador;
    renderLista();
  };

  for (const s of separadores) {
    s.addEventListener("click", () => escolher(s));
    s.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const outro = separadores.find((x) => x !== s);
        escolher(outro);
        outro.focus();
      }
    });
  }
}

// --- Formulário "Agendar reunião" (janela) --------------------------------

function renderParticipantes() {
  escolhidos.innerHTML = estado.participantes.map((id) => {
    const p = dados.pessoas.get(id);
    const souEu = id === dados.eu.id;
    return `
      <span class="participante">
        ${avatar(p, "sm")} ${esc(p.nome)}
        ${souEu
          ? '<span class="participante__papel">Organizador(a)</span>'
          : `<button class="participante__remover" type="button" data-remover="${id}" aria-label="Remover ${esc(p.nome)}">
               <img src="../assets/icons/x.svg" alt="" width="16" height="16">
             </button>`}
      </span>`;
  }).join("");

  const disponiveis = [...dados.pessoas.values()].filter((p) => !estado.participantes.includes(p.id));
  adicionar.innerHTML = `<option value="">${disponiveis.length ? "Adicionar participantes" : "Todos adicionados"}</option>`
    + disponiveis.map((p) => `<option value="${p.id}">${esc(p.nome)}</option>`).join("");
  adicionar.disabled = !disponiveis.length;

  const n = estado.participantes.length;
  document.querySelector("[data-contagem]").textContent = `${n} ${n === 1 ? "selecionado" : "selecionados"}, incluindo o organizador`;
}

function atualizarDuracao() {
  const [h1, m1] = form.inicio.value.split(":").map(Number);
  const [h2, m2] = form.fim.value.split(":").map(Number);
  const minutos = h2 * 60 + m2 - (h1 * 60 + m1);
  let texto = "—";
  if (minutos > 0) {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    texto = [h ? `${h} hora${h > 1 ? "s" : ""}` : "", m ? `${m} min` : ""].filter(Boolean).join(" ");
  }
  document.querySelector("[data-duracao]").textContent = `Fuso horário: Lisboa · Duração: ${texto}`;
}

function limparErros() {
  form.querySelectorAll(".campo__erro").forEach((p) => (p.textContent = ""));
  form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
}

function validar() {
  limparErros();
  const erros = [];
  if (!form.titulo.value.trim()) erros.push(["titulo", "Escreve o título da reunião."]);
  if (!form.projetoId.value) erros.push(["projeto", "Escolhe o projeto."]);
  if (estado.participantes.length < 2) erros.push(["participantes", "Adiciona pelo menos um participante."]);
  if (!form.data.value) erros.push(["data", "Escolhe a data."]);
  else if (form.data.value < chaveDia(new Date())) erros.push(["data", "A data não pode ser no passado."]);
  if (!form.inicio.value) erros.push(["inicio", "Indica a hora de início."]);
  if (!form.fim.value) erros.push(["fim", "Indica a hora de fim."]);
  else if (form.inicio.value && form.fim.value <= form.inicio.value) erros.push(["fim", "Tem de ser depois da hora de início."]);
  if (!form.local.value.trim()) erros.push(["local", "Indica o local ou a ligação."]);

  for (const [campo, texto] of erros) {
    document.getElementById(`erro-${campo}`).textContent = texto;
    const alvo = campo === "participantes" ? document.querySelector("[data-participantes]") : form.querySelector(`#${campo}`);
    alvo.setAttribute("aria-invalid", "true");
  }
  if (erros.length) {
    const primeiro = erros[0][0];
    (primeiro === "participantes" ? adicionar : form.querySelector(`#${primeiro}`)).focus();
  }
  return !erros.length;
}

function abrirFormulario(projetoId = "") {
  form.reset();
  limparErros();
  estado.participantes = [dados.eu.id];
  form.projetoId.value = projetoId;
  form.data.value = chaveDia(new Date());
  form.data.min = chaveDia(new Date());
  renderParticipantes();
  atualizarDuracao();
  dialogo.showModal();
  form.titulo.focus();
}

async function agendar(e) {
  e.preventDefault();
  if (!validar()) return;
  const data = form.data.value;
  const reuniao = await criarReuniao({
    titulo: form.titulo.value.trim(),
    projetoId: form.projetoId.value === "todos" ? null : Number(form.projetoId.value),
    inicio: new Date(`${data}T${form.inicio.value}`).toISOString(),
    fim: new Date(`${data}T${form.fim.value}`).toISOString(),
    local: form.local.value.trim(),
    descricao: form.descricao.value.trim(),
    participantes: estado.participantes,
  });
  dados.reunioes.push(reuniao);
  dados.reunioes.sort((a, b) => a.inicio.localeCompare(b.inicio));
  dialogo.close();
  document.getElementById("tab-proximas").click();
  aviso("Reunião agendada. Os convites foram enviados.");
}

function ligarFormulario() {
  document.querySelector("[data-agendar]").addEventListener("click", () => abrirFormulario());
  form.querySelector("[data-cancelar]").addEventListener("click", () => dialogo.close());
  form.addEventListener("submit", agendar);

  adicionar.addEventListener("change", () => {
    if (!adicionar.value) return;
    estado.participantes.push(Number(adicionar.value));
    document.getElementById("erro-participantes").textContent = "";
    document.querySelector("[data-participantes]").removeAttribute("aria-invalid");
    renderParticipantes();
    adicionar.focus();
  });
  escolhidos.addEventListener("click", (e) => {
    const botao = e.target.closest("[data-remover]");
    if (!botao) return;
    estado.participantes = estado.participantes.filter((id) => id !== Number(botao.dataset.remover));
    renderParticipantes();
    adicionar.focus();
  });
  // Ao corrigir um campo, o erro desse campo desaparece
  form.addEventListener("input", (e) => {
    const campo = e.target.closest(".campo");
    if (!campo) return;
    campo.querySelector(".campo__erro").textContent = "";
    e.target.removeAttribute("aria-invalid");
  });
  form.inicio.addEventListener("change", atualizarDuracao);
  form.fim.addEventListener("change", atualizarDuracao);
}

// --- Detalhe: estado, videochamada, resumo e decisões (só com o backend) ----

const ESTADOS_REUNIAO = { agendada: "Agendada", em_curso: "Em curso", concluida: "Concluída", cancelada: "Cancelada" };
const ESTADOS_DECISAO = { pendente: "aviso", confirmada: "sucesso", rejeitada: "erro" };

async function htmlDetalhe(r) {
  const organizador = r.organizadorId === dados.eu.id;
  const ativa = ["agendada", "em_curso"].includes(r.estado);
  const { resumos, decisoes } = await getResumos(r.id);

  return `
    <h2 class="dialogo__titulo">${esc(r.titulo)}</h2>
    <p class="nota">${quando(r)} · ${ESTADOS_REUNIAO[r.estado] ?? ""}</p>
    ${r.descricao ? `<p class="detalhe__texto">${esc(r.descricao)}</p>` : ""}

    <div class="detalhe__acoes">
      ${ativa ? `<a class="botao botao--compacto" href="chamada.html?reuniao=${r.id}">Entrar na videochamada</a>` : ""}
      ${organizador && r.estado === "agendada" ? '<button class="botao botao--compacto botao--secundario" type="button" data-mudar-estado="em_curso">Começar reunião</button>' : ""}
      ${organizador && r.estado === "em_curso" ? '<button class="botao botao--compacto botao--secundario" type="button" data-mudar-estado="concluida">Concluir reunião</button>' : ""}
    </div>

    <section class="seccao">
      <h3 class="seccao__titulo">Resumo e decisões</h3>
      ${resumos.map((x) => `<p class="detalhe__texto">${esc(x.texto)}</p>`).join("") || '<p class="nota">Ainda não há resumo.</p>'}
      <ul class="lista-simples">
        ${decisoes.map((d) => `
          <li>
            <div class="lista-simples__corpo">
              <p class="lista-simples__titulo">${esc(d.texto)}</p>
              ${d.responsavel ? `<p class="lista-simples__meta">Responsável: ${esc(d.responsavel)}</p>` : ""}
            </div>
            ${d.estado === "pendente" ? `
              <button class="botao-texto" type="button" data-decisao="${d.id}" data-estado="confirmada">Confirmar</button>
              <button class="botao-texto" type="button" data-decisao="${d.id}" data-estado="rejeitada">Rejeitar</button>`
              : `<span class="etiqueta etiqueta--${ESTADOS_DECISAO[d.estado]}">${esc(d.estado)}</span>`}
          </li>`).join("")}
      </ul>
      ${organizador && ["em_curso", "concluida"].includes(r.estado) ? `
        <div class="formulario">
          <div class="campo formulario__total">
            <label for="notas-reuniao">Notas da reunião</label>
            <textarea id="notas-reuniao" rows="4" data-notas placeholder="O que se falou e o que ficou decidido"></textarea>
          </div>
          <button class="botao botao--compacto formulario__total" type="button" data-gerar-resumo>Gerar resumo com IA</button>
        </div>` : ""}
    </section>

    <div class="dialogo__acoes">
      <button class="botao botao--secundario" type="button" data-fechar>Fechar</button>
    </div>`;
}

async function abrirDetalhe(id) {
  const r = dados.reunioes.find((x) => x.id === id);
  const janela = document.createElement("dialog");
  janela.className = "dialogo";
  document.body.append(janela);
  const desenhar = async () => {
    janela.innerHTML = await htmlDetalhe(r);
  };
  await desenhar();
  janela.showModal();

  janela.addEventListener("close", () => janela.remove());
  janela.addEventListener("click", async (e) => {
    const alvo = e.target.closest("button");
    if (!alvo) return;
    if (alvo.dataset.fechar !== undefined) janela.close();
    if (alvo.dataset.mudarEstado) {
      await alterarEstadoReuniao(r.id, alvo.dataset.mudarEstado);
      r.estado = alvo.dataset.mudarEstado;
    }
    if (alvo.dataset.decisao) await validarDecisao(alvo.dataset.decisao, alvo.dataset.estado);
    if (alvo.dataset.gerarResumo !== undefined) {
      alvo.disabled = true;
      await gerarResumo(r.id, janela.querySelector("[data-notas]").value).finally(() => (alvo.disabled = false));
      aviso("Resumo gerado.");
    }
    if (alvo.dataset.mudarEstado || alvo.dataset.decisao || alvo.dataset.gerarResumo !== undefined) await desenhar();
  });
}

// --- Arranque -------------------------------------------------------------

async function iniciar() {
  const [reunioes, projetos, pessoas, eu] = await Promise.all([getReunioes(), getProjetos(), getUtilizadores(), getUtilizadorAtual()]);
  Object.assign(dados, { reunioes, projetos: porId(projetos), pessoas: porId(pessoas), eu });

  form.projetoId.insertAdjacentHTML("beforeend", projetos.map((p) => `<option value="${p.id}">${esc(p.nome)}</option>`).join(""));
  ativarSeparadores();
  ligarFormulario();
  renderLista();
  if (await usarApi()) {
    lista.addEventListener("click", (e) => {
      const botao = e.target.closest("[data-abrir]");
      if (botao) abrirDetalhe(Number(botao.dataset.abrir));
    });
  }

  // Links de outras páginas: ?agendar=1 abre o formulário; &projeto=2 já escolhe o projeto
  const params = new URLSearchParams(location.search);
  if (params.get("agendar")) {
    abrirFormulario(params.get("projeto") ?? "");
    history.replaceState(null, "", "reunioes.html");
  }
}

iniciar().catch((erro) => {
  console.error(erro);
  lista.innerHTML = '<li class="erro-carregar" role="alert">Não foi possível carregar as reuniões. Tenta novamente.</li>';
});
