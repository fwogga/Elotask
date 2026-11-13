import {
  getTurnos,
  getUtilizadores,
  getUtilizadorAtual,
  getPedidosTroca,
  pedirTrocaTurno,
  usarPrincipal,
  getAusencias,
  getAusenciasParaAprovar,
  pedirAusencia,
  cancelarAusencia,
  decidirAusencia,
  criarTurno,
  gerarEscala,
  definirDisponibilidade,
} from "../api/client.js";
import { esc, avatar, porId, diaRelativo, dataCompleta, aviso, pedirDados, chaveDia } from "../comum.js";

const dialogo = document.querySelector("[data-dialogo]");
const form = document.querySelector("[data-form]");
const dados = { turnos: [], pessoas: new Map(), eu: null };

// "Hoje · 12 Nov 2026" para hoje, amanhã e ontem; nos outros dias só a data
function tituloDia(dia) {
  const rel = diaRelativo(`${dia}T00:00`);
  const data = dataCompleta(`${dia}T00:00`);
  return ["Hoje", "Amanhã", "Ontem"].includes(rel) ? `${rel} · ${data}` : data;
}

const nomeTurno = (t) => `${t.nome} · ${diaRelativo(`${t.data}T${t.inicio}`)}, ${t.inicio}–${t.fim}`;

function renderTurnos() {
  const porDia = Map.groupBy(dados.turnos, (t) => t.data);
  document.querySelector("[data-dias]").innerHTML = [...porDia].map(([dia, turnos]) => `
    <section class="turnos-dia">
      <h2 class="turnos-dia__titulo">${tituloDia(dia)}</h2>
      <div class="turnos-dia__lista">
        ${turnos.map((t) => {
          const meu = t.colaboradores.includes(dados.eu.id);
          return `
            <article class="cartao turno${meu ? " turno--meu" : ""}">
              <div class="turno__cabecalho">
                <span class="turno__nome">${esc(t.nome)}</span>
                ${meu ? '<span class="etiqueta etiqueta--sucesso">O meu turno</span>' : ""}
              </div>
              <p class="turno__hora">${t.inicio} – ${t.fim}</p>
              <span class="pilha-avatares">${t.colaboradores.map((id) => dados.pessoas.get(id)).filter(Boolean).map((p) => avatar(p, "sm")).join("")}</span>
            </article>`;
        }).join("")}
      </div>
    </section>`).join("") || '<p class="vazio">Não há turnos marcados.</p>';
}

async function renderPedidos() {
  const pedidos = await getPedidosTroca();
  const turnos = porId(dados.turnos);
  const descrever = (id) => (turnos.get(id) ? nomeTurno(turnos.get(id)) : "Turno");
  document.querySelector("[data-pedidos]").innerHTML = pedidos.length ? pedidos.map((p) => `
    <li>
      <div class="lista-simples__corpo">
        <p class="lista-simples__titulo">${esc(descrever(p.turnoId))} ↔ ${esc(descrever(p.paraTurnoId))}</p>
        <p class="lista-simples__texto">${esc(p.com ? `Com ${p.com}` : "")}${p.com && p.motivo ? " · " : ""}${esc(p.motivo || "")}</p>
      </div>
      <span class="etiqueta etiqueta--aviso">${esc(p.estado)}</span>
    </li>`).join("") : '<li class="vazio">Ainda não pediste nenhuma troca.</li>';
}

// Cada opção de "Trocar com" é um par turno + colega, só de turnos que não são meus
function opcoesTroca() {
  return dados.turnos.filter((t) => !t.colaboradores.includes(dados.eu.id)).flatMap((t) => t.colaboradores
    .filter((id) => id !== dados.eu.id && dados.pessoas.has(id))
    .map((id) => `<option value="${t.id}:${id}">${esc(dados.pessoas.get(id).nome)} · ${esc(nomeTurno(t))}</option>`));
}

function ligarDialogo() {
  document.querySelector("[data-pedir]").addEventListener("click", () => {
    const meus = dados.turnos.filter((t) => t.colaboradores.includes(dados.eu.id));
    if (!meus.length) {
      aviso("Não tens turnos atribuídos para trocar.");
      return;
    }
    form.reset();
    document.querySelector("[data-turnos]").innerHTML = meus.map((t) => `<option value="${t.id}">${esc(nomeTurno(t))}</option>`).join("");
    document.querySelector("[data-trocas]").innerHTML = opcoesTroca().join("");
    dialogo.showModal();
  });
  form.querySelector("[data-cancelar]").addEventListener("click", () => dialogo.close());
  form.addEventListener("submit", async () => {
    const [paraTurnoId, comId] = form.troca.value.split(":").map(Number);
    await pedirTrocaTurno({ turnoId: Number(form.turno.value), paraTurnoId, comId, motivo: form.motivo.value.trim() });
    aviso("Pedido de troca enviado.");
    await renderPedidos();
  });
}

// --- Ausências --------------------------------------------------------------

const TIPOS_AUSENCIA = { ferias: "Férias", folga: "Folga", outra: "Outra" };
const ESTADOS_AUSENCIA = { pendente: "aviso", aprovado: "sucesso", rejeitado: "erro", cancelado: "erro" };
const periodo = (a) => (a.inicio === a.fim ? dataCompleta(`${a.inicio}T00:00`) : `${dataCompleta(`${a.inicio}T00:00`)} – ${dataCompleta(`${a.fim}T00:00`)}`);

function linhaAusencia(a, acoes) {
  return `
    <li>
      <div class="lista-simples__corpo">
        <p class="lista-simples__titulo">${a.pessoa && a.pessoaId !== dados.eu.id ? `${esc(a.pessoa)} · ` : ""}${TIPOS_AUSENCIA[a.tipo] ?? esc(a.tipo)} · ${periodo(a)}</p>
        <p class="lista-simples__texto">${esc(a.motivo)}</p>
      </div>
      <span class="etiqueta etiqueta--${ESTADOS_AUSENCIA[a.estado] ?? "aviso"}">${esc(a.estado)}</span>
      ${acoes}
    </li>`;
}

async function renderAusencias() {
  const minhas = await getAusencias();
  document.querySelector("[data-ausencias]").innerHTML = minhas.map((a) => linhaAusencia(a,
    a.estado === "pendente" ? `<button class="botao-texto" type="button" data-cancelar-ausencia="${a.id}">Cancelar</button>` : "",
  )).join("") || '<li class="vazio">Ainda não pediste nenhuma ausência.</li>';

  if (!dados.eu.gestor) return;
  const porAprovar = (await getAusenciasParaAprovar()).filter((a) => a.pessoaId !== dados.eu.id);
  document.querySelector("[data-seccao-aprovar]").hidden = false;
  document.querySelector("[data-aprovar]").innerHTML = porAprovar.map((a) => linhaAusencia(a, `
    <div class="lista-simples__acoes">
      <button class="botao-texto" type="button" data-decidir="${a.id}" data-estado="aprovado">Aprovar</button>
      <button class="botao-texto" type="button" data-decidir="${a.id}" data-estado="rejeitado">Rejeitar</button>
    </div>`)).join("") || '<li class="vazio">Não há pedidos por aprovar.</li>';
}

function ligarAusencias() {
  document.querySelector("[data-pedir-ausencia]").addEventListener("click", async () => {
    const hoje = chaveDia(new Date());
    const d = await pedirDados("Pedir ausência", [
      { nome: "tipo", rotulo: "Tipo", tipo: "select", opcoes: Object.entries(TIPOS_AUSENCIA) },
      { nome: "inicio", rotulo: "De", tipo: "date", valor: hoje },
      { nome: "fim", rotulo: "Até", tipo: "date", valor: hoje },
      { nome: "motivo", rotulo: "Motivo", tipo: "textarea" },
    ], "Enviar pedido");
    if (!d) return;
    await pedirAusencia(d);
    aviso("Pedido de ausência enviado.");
    await renderAusencias();
  });

  document.querySelector(".conteudo").addEventListener("click", async (e) => {
    const cancelar = e.target.closest("[data-cancelar-ausencia]");
    const decidir = e.target.closest("[data-decidir]");
    if (cancelar) await cancelarAusencia(cancelar.dataset.cancelarAusencia);
    if (decidir) await decidirAusencia(decidir.dataset.decidir, decidir.dataset.estado);
    if (cancelar || decidir) await renderAusencias();
  });
}

// --- Criar turnos e gerar a escala (só admin) -------------------------------

async function recarregarTurnos() {
  dados.turnos = await getTurnos();
  renderTurnos();
}

function ligarAdmin() {
  const novo = document.querySelector("[data-novo-turno]");
  const gerar = document.querySelector("[data-gerar-escala]");
  const disponibilidade = document.querySelector("[data-disponibilidade]");
  novo.hidden = gerar.hidden = disponibilidade.hidden = false;
  const hoje = chaveDia(new Date());

  // A escala só põe pessoas em turnos dentro da disponibilidade delas
  disponibilidade.addEventListener("click", async () => {
    const d = await pedirDados("Disponibilidade", [
      { nome: "pessoa", rotulo: "Pessoa", tipo: "select", opcoes: [...dados.pessoas.values()].map((p) => [String(p.id), p.nome]) },
      { nome: "dias", rotulo: "Dias", tipo: "select", opcoes: [["uteis", "Segunda a sexta"], ["todos", "Todos os dias"]] },
      { nome: "inicio", rotulo: "Das", tipo: "time", valor: "08:00" },
      { nome: "fim", rotulo: "Às", tipo: "time", valor: "20:00" },
    ]);
    if (!d) return;
    const uteis = ["segunda", "terca", "quarta", "quinta", "sexta"];
    await definirDisponibilidade(d.pessoa, d.dias === "todos" ? [...uteis, "sabado", "domingo"] : uteis, d.inicio, d.fim);
    aviso("Disponibilidade guardada.");
  });

  novo.addEventListener("click", async () => {
    const d = await pedirDados("Novo turno", [
      { nome: "nome", rotulo: "Nome", valor: "Turno da manhã" },
      { nome: "data", rotulo: "Dia", tipo: "date", valor: hoje },
      { nome: "inicio", rotulo: "Início", tipo: "time", valor: "09:00" },
      { nome: "fim", rotulo: "Fim", tipo: "time", valor: "17:00" },
      { nome: "vagas", rotulo: "Pessoas necessárias", tipo: "number", valor: "1" },
    ], "Criar turno");
    if (!d) return;
    await criarTurno({ ...d, vagas: Number(d.vagas) || 1 });
    aviso("Turno criado.");
    await recarregarTurnos();
  });

  gerar.addEventListener("click", async () => {
    const d = await pedirDados("Gerar escala com IA", [
      { nome: "inicio", rotulo: "De", tipo: "date", valor: hoje },
      { nome: "fim", rotulo: "Até", tipo: "date", valor: chaveDia(new Date(Date.now() + 7 * 86400000)) },
    ], "Gerar");
    if (!d) return;
    const r = await gerarEscala(d);
    aviso(`Escala gerada: ${r.total_atribuicoes} atribuições.`);
    await recarregarTurnos();
  });
}

async function iniciar() {
  const [turnos, pessoas, eu] = await Promise.all([getTurnos(), getUtilizadores(), getUtilizadorAtual()]);
  Object.assign(dados, { turnos, pessoas: porId(pessoas), eu });
  renderTurnos();
  await renderPedidos();
  ligarDialogo();

  if (await usarPrincipal()) {
    document.querySelector("[data-seccao-ausencias]").hidden = false;
    ligarAusencias();
    await renderAusencias();
    if (eu.gestor) ligarAdmin();
  }
}

iniciar().catch((erro) => {
  console.error(erro);
  document.querySelector(".conteudo").insertAdjacentHTML(
    "beforeend",
    '<p class="erro-carregar" role="alert">Não foi possível carregar os turnos.</p>'
  );
});
