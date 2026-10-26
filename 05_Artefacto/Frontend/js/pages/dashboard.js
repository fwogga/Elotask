import {
  getUtilizadorAtual,
  getResumo,
  getProjetos,
  getTarefasRecentes,
  getProximasReunioes,
} from "../api/client.js";

const icone = (nome, tamanho) =>
  `<img src="../assets/icons/${nome}" alt="" width="${tamanho}" height="${tamanho}">`;

// Escapa texto vindo da API antes de o meter no HTML (evita injeção de código)
const esc = (texto) =>
  String(texto).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const classeCor = (cor) => (cor ? ` icone-bloco--${cor}` : "");

const ESTADOS = {
  em_andamento: { rotulo: "Em andamento", classe: "sucesso" },
  planeamento: { rotulo: "Planeamento", classe: "erro" },
  concluido: { rotulo: "Concluído", classe: "sucesso" },
};

const PRIORIDADES = {
  alta: { rotulo: "Alta", classe: "erro" },
  media: { rotulo: "Média", classe: "aviso" },
  baixa: { rotulo: "Baixa", classe: "sucesso" },
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
      <span class="icone-bloco${classeCor(e.cor)}">${icone(e.icone, 28)}</span>
      <div>
        <p class="estatistica__rotulo">${e.rotulo}</p>
        <p class="estatistica__valor">${esc(e.valor)}</p>
      </div>
    </li>`).join("");
}

function renderProjetos(projetos) {
  return projetos.map((p) => {
    const estado = ESTADOS[p.estado] ?? ESTADOS.em_andamento;
    const progresso = Number(p.progresso) || 0;

    return `
    <li>
      <a class="cartao projeto" href="projetos.html?id=${encodeURIComponent(p.id)}">
        <div class="projeto__cabecalho">
          <span class="icone-bloco${classeCor(p.cor)}">${icone(p.icone, 28)}</span>
          <h3 class="projeto__nome">${esc(p.nome)}</h3>
        </div>
        <span class="etiqueta etiqueta--ponto etiqueta--${estado.classe}">${estado.rotulo}</span>
        <div class="progresso">
          <div class="progresso__trilho" role="progressbar" aria-valuenow="${progresso}" aria-valuemin="0" aria-valuemax="100" aria-label="Progresso de ${esc(p.nome)}">
            <div class="progresso__barra" style="width: ${progresso}%"></div>
          </div>
          <span>${progresso}%</span>
        </div>
        <p class="projeto__rodape">${icone("user.svg", 18)} ${esc(p.tarefasPendentes)} tarefas pendentes</p>
      </a>
    </li>`;
  }).join("");
}

function renderTarefas(tarefas) {
  return tarefas.map((t) => {
    const prioridade = PRIORIDADES[t.prioridade] ?? PRIORIDADES.media;

    return `
    <li class="tarefa">
      <span class="icone-bloco${classeCor(t.cor)}">${icone(t.icone, 22)}</span>
      <div class="tarefa__texto">
        <p class="tarefa__titulo">${esc(t.titulo)}</p>
        <p class="tarefa__projeto">${esc(t.projeto)}</p>
      </div>
      <span class="etiqueta etiqueta--${prioridade.classe}">${prioridade.rotulo}</span>
      <p class="tarefa__prazo">${esc(t.prazo)}</p>
    </li>`;
  }).join("");
}

function renderReunioes(reunioes) {
  return reunioes.map((r) => `
    <li>
      <a class="reuniao" href="reunioes.html?id=${encodeURIComponent(r.id)}">
        <span class="icone-bloco">${icone("meeting.svg", 26)}</span>
        <div class="reuniao__texto">
          <p class="reuniao__titulo">${esc(r.titulo)}</p>
          <p class="reuniao__quando">${esc(r.quando)}</p>
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
  document.querySelector("[data-projetos]").innerHTML = renderProjetos(projetos);
  document.querySelector("[data-tarefas]").innerHTML = renderTarefas(tarefas);
  document.querySelector("[data-reunioes]").innerHTML = renderReunioes(reunioes);
}

iniciar().catch((erro) => {
  console.error(erro);
  document.querySelector(".conteudo").insertAdjacentHTML(
    "beforeend",
    '<p class="erro-carregar" role="alert">Não foi possível carregar os dados. Tenta novamente.</p>'
  );
});
