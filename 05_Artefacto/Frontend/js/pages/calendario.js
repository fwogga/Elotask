import { getReunioes, getTarefas } from "../api/client.js";
import { esc, hora, chaveDia, diaRelativo, dataCurta, mesAno, paraData } from "../comum.js";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MAX_POR_DIA = 3;

const estado = { vista: "mes", ref: new Date(), eventos: [] };
const corpo = document.querySelector("[data-corpo]");

// Reuniões e prazos de tarefas por concluir, no mesmo formato
function prepararEventos(reunioes, tarefas) {
  const deReunioes = reunioes.map((r) => ({
    titulo: r.titulo,
    dia: chaveDia(r.inicio),
    ordem: r.inicio,
    hora: `${hora(r.inicio)} – ${hora(r.fim)}`,
    horaCurta: hora(r.inicio),
    classe: "",
    prazo: false,
    link: "reunioes.html",
  }));

  const dePrazos = tarefas
    .filter((t) => t.estado !== "concluida")
    .map((t) => ({
      titulo: t.titulo,
      dia: t.prazo,
      ordem: `${t.prazo}T23:59`,
      hora: "Data-limite",
      horaCurta: "Prazo",
      classe: t.prioridade === "alta" ? "evento--alta" : t.prioridade === "media" ? "evento--media" : "evento--prazo",
      prazo: true,
      link: `tarefas.html?tarefa=${t.id}`,
    }));

  return [...deReunioes, ...dePrazos].sort((a, b) => a.ordem.localeCompare(b.ordem));
}

const eventosDoDia = (dia) => estado.eventos.filter((e) => e.dia === dia);

function htmlEvento(e, horaTexto = e.horaCurta) {
  return `
    <a class="evento ${e.classe}" href="${e.link}" title="${esc(e.titulo)}">
      <span class="evento__titulo"><span>${esc(e.titulo)}</span></span>
      <span class="evento__hora">${horaTexto}</span>
    </a>`;
}

function htmlCelula(data, foraDoMes) {
  const dia = chaveDia(data);
  const eventos = eventosDoDia(dia);
  const visiveis = estado.vista === "semana" ? eventos : eventos.slice(0, MAX_POR_DIA);
  const resto = eventos.length - visiveis.length;
  const classes = ["celula", foraDoMes ? "celula--fora" : "", dia === chaveDia(new Date()) ? "celula--hoje" : ""].join(" ").trim();

  return `
    <div class="${classes}">
      <span class="celula__numero">${data.getDate()}</span>
      ${visiveis.map((e) => htmlEvento(e, estado.vista === "semana" ? e.hora : e.horaCurta)).join("")}
      ${resto > 0 ? `<span class="celula__mais">+${resto} mais</span>` : ""}
    </div>`;
}

function inicioDaSemana(d) {
  const inicio = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  inicio.setDate(inicio.getDate() - inicio.getDay());
  return inicio;
}

function renderGrelha() {
  const ref = estado.ref;
  let inicio;
  let totalDias;

  if (estado.vista === "semana") {
    inicio = inicioDaSemana(ref);
    totalDias = 7;
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 6);
    document.querySelector("[data-periodo]").textContent = `${dataCurta(inicio)} – ${dataCurta(fim)} ${fim.getFullYear()}`;
  } else {
    const primeiro = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const ultimo = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
    inicio = inicioDaSemana(primeiro);
    totalDias = Math.ceil((primeiro.getDay() + ultimo.getDate()) / 7) * 7;
    document.querySelector("[data-periodo]").textContent = mesAno(ref);
  }

  const celulas = [];
  for (let i = 0; i < totalDias; i++) {
    const d = new Date(inicio);
    d.setDate(d.getDate() + i);
    celulas.push(htmlCelula(d, estado.vista === "mes" && d.getMonth() !== ref.getMonth()));
  }

  corpo.innerHTML = `
    <div class="grelha${estado.vista === "semana" ? " grelha--semana" : ""}">
      ${DIAS_SEMANA.map((d) => `<div class="grelha__dia-semana">${d}</div>`).join("")}
      ${celulas.join("")}
    </div>`;
}

function renderLista() {
  const prefixo = chaveDia(estado.ref).slice(0, 7);
  const doMes = estado.eventos.filter((e) => e.dia.startsWith(prefixo));
  document.querySelector("[data-periodo]").textContent = mesAno(estado.ref);

  const dias = [...new Set(doMes.map((e) => e.dia))];
  corpo.innerHTML = `
    <div class="cartao agenda">
      ${dias.length ? dias.map((dia) => `
        <section class="agenda__dia">
          <h3>${diaRelativo(dia)} · ${paraData(dia).toLocaleDateString("pt-PT", { weekday: "long" })}</h3>
          <div class="agenda__eventos">${eventosDoDia(dia).map((e) => htmlEvento(e, e.hora)).join("")}</div>
        </section>`).join("") : '<p class="vazio">Sem eventos neste mês.</p>'}
    </div>`;
}

function renderProximos() {
  const hoje = chaveDia(new Date());
  const proximos = estado.eventos.filter((e) => e.dia >= hoje).slice(0, 6);
  const dias = [...new Set(proximos.map((e) => e.dia))];

  document.querySelector("[data-proximos]").innerHTML = dias.length ? dias.map((dia) => `
    <h3 class="proximos__dia">${diaRelativo(dia)}</h3>
    ${proximos.filter((e) => e.dia === dia).map((e) => `
      <a class="proximo${e.prazo ? " proximo--prazo" : ""}" href="${e.link}">
        <span class="proximo__titulo">${esc(e.titulo)}</span>
        <span class="proximo__hora">${e.hora}</span>
      </a>`).join("")}`).join("") : '<p class="vazio">Sem eventos marcados.</p>';
}

function render() {
  for (const b of document.querySelectorAll("[data-vista]")) {
    b.setAttribute("aria-pressed", String(b.dataset.vista === estado.vista));
  }
  if (estado.vista === "lista") renderLista();
  else renderGrelha();
}

function mover(passo) {
  const r = estado.ref;
  estado.ref = estado.vista === "semana"
    ? new Date(r.getFullYear(), r.getMonth(), r.getDate() + passo * 7)
    : new Date(r.getFullYear(), r.getMonth() + passo, 1);
  render();
}

async function iniciar() {
  const [reunioes, tarefas] = await Promise.all([getReunioes(), getTarefas()]);
  estado.eventos = prepararEventos(reunioes, tarefas);

  document.querySelector("[data-anterior]").addEventListener("click", () => mover(-1));
  document.querySelector("[data-seguinte]").addEventListener("click", () => mover(1));
  document.querySelector("[data-hoje]").addEventListener("click", () => {
    estado.ref = new Date();
    render();
  });
  for (const b of document.querySelectorAll("[data-vista]")) {
    b.addEventListener("click", () => {
      estado.vista = b.dataset.vista;
      render();
    });
  }

  render();
  renderProximos();
}

iniciar().catch((erro) => {
  console.error(erro);
  corpo.innerHTML = '<p class="erro-carregar" role="alert">Não foi possível carregar o calendário. Tenta novamente.</p>';
});
