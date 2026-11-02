import {
  getUtilizadorAtual,
  getResumo,
  getProjetos,
  getTarefasRecentes,
  getProximasReunioes,
} from "../api/client.js";
import { cartaoProjeto, esc, diaRelativo, intervalo, icone, porId } from "../comum.js";

const PRIORIDADES = {
  alta: { rotulo: "Alta", classe: "erro", cor: "vermelho", icone: "task-edit.svg" },
  media: { rotulo: "Média", classe: "aviso", cor: "laranja", icone: "task-chat.svg" },
  baixa: { rotulo: "Baixa", classe: "sucesso", cor: "primaria", icone: "task-code.svg" },
};

function renderEstatisticas(resumo) {
  const itens = [
    { rotulo: "Projetos Ativos", valor: resumo.projetosAtivos, icone: "stat-projetos.svg", cor: "menta" },
    { rotulo: "Tarefas Pendentes", valor: resumo.tarefasPendentes, icone: "stat-tarefas.svg", cor: "coral" },
    { rotulo: "Reuniões Hoje", valor: resumo.reunioesHoje, icone: "stat-reunioes.svg", cor: "" },
    { rotulo: "Membros da Equipa", valor: resumo.membrosEquipa, icone: "stat-membros.svg", cor: "menta" },
  ];

  return itens.map((e) => `
    <li class="cartao estatistica">
      <span class="icone-bloco${e.cor ? ` icone-bloco--${e.cor}` : ""}">${icone(e.icone, 28)}</span>
      <div>
        <p class="estatistica__rotulo">${e.rotulo}</p>
        <p class="estatistica__valor">${esc(e.valor)}</p>
      </div>
    </li>`).join("");
}

function renderTarefas(tarefas, projetos) {
  if (!tarefas.length) return '<li class="vazio">Não tens tarefas pendentes.</li>';

  return tarefas.map((t) => {
    const p = PRIORIDADES[t.prioridade] ?? PRIORIDADES.media;
    return `
    <li>
      <a class="tarefa" href="tarefas.html?tarefa=${t.id}">
        <span class="icone-bloco icone-bloco--${p.cor}">${icone(p.icone, 22)}</span>
        <div class="tarefa__texto">
          <p class="tarefa__titulo">${esc(t.titulo)}</p>
          <p class="tarefa__projeto">${esc(projetos.get(t.projetoId)?.nome ?? "")}</p>
        </div>
        <span class="etiqueta etiqueta--${p.classe}">${p.rotulo}</span>
        <p class="tarefa__prazo">${diaRelativo(t.prazo)}</p>
      </a>
    </li>`;
  }).join("");
}

function renderReunioes(reunioes) {
  if (!reunioes.length) return '<li class="vazio">Sem reuniões marcadas.</li>';

  return reunioes.map((r) => `
    <li>
      <a class="reuniao" href="reunioes.html">
        <span class="icone-bloco">${icone("meeting.svg", 26)}</span>
        <div class="reuniao__texto">
          <p class="reuniao__titulo">${esc(r.titulo)}</p>
          <p class="reuniao__quando">${intervalo(r.inicio, r.fim)}</p>
        </div>
        ${icone("chevron-right.svg", 18)}
      </a>
    </li>`).join("");
}

async function iniciar() {
  const [utilizador, resumo, projetos, tarefas, reunioes] = await Promise.all([
    getUtilizadorAtual(),
    getResumo(),
    getProjetos(),
    getTarefasRecentes(),
    getProximasReunioes(),
  ]);

  document.querySelector("[data-primeiro-nome]").textContent = utilizador.nome.split(" ")[0];
  document.querySelector("[data-estatisticas]").innerHTML = renderEstatisticas(resumo);
  document.querySelector("[data-projetos]").innerHTML = projetos.map(cartaoProjeto).join("");
  document.querySelector("[data-tarefas]").innerHTML = renderTarefas(tarefas, porId(projetos));
  document.querySelector("[data-reunioes]").innerHTML = renderReunioes(reunioes);
}

iniciar().catch((erro) => {
  console.error(erro);
  document.querySelector(".conteudo").insertAdjacentHTML(
    "beforeend",
    '<p class="erro-carregar" role="alert">Não foi possível carregar os dados. Tenta novamente.</p>'
  );
});
