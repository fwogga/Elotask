// Dados de exemplo até o backend estar pronto.
// Os nomes dos campos devem ser combinados com quem faz a API.

export const utilizadorAtual = {
  id: 1,
  nome: "Cássia Baptista",
  email: "cassia.baptista@elotask.pt",
  funcao: "Gestora de Projetos",
  naoLidas: { mensagens: 4 },
};

export const resumo = {
  projetosAtivos: 4,
  tarefasPendentes: 12,
  reunioesHoje: 2,
  membrosEquipa: 8,
};

// estado: "em_andamento" | "planeamento" | "concluido"
export const projetos = [
  { id: 1, nome: "EloTask Website", estado: "em_andamento", progresso: 80, tarefasPendentes: 6, icone: "proj-globe.svg", cor: "" },
  { id: 2, nome: "App Mobile", estado: "em_andamento", progresso: 45, tarefasPendentes: 8, icone: "proj-mobile.svg", cor: "violeta" },
  { id: 3, nome: "Marketing Digital", estado: "planeamento", progresso: 0, tarefasPendentes: 5, icone: "proj-megafone.svg", cor: "erro" },
  { id: 4, nome: "Investigação", estado: "em_andamento", progresso: 72, tarefasPendentes: 3, icone: "proj-pesquisa.svg", cor: "menta" },
];

// prioridade: "alta" | "media" | "baixa"
export const tarefasRecentes = [
  { id: 1, titulo: "Rever design da página inicial", projeto: "EloTask Website", prioridade: "alta", prazo: "Hoje", icone: "task-edit.svg", cor: "vermelho" },
  { id: 2, titulo: "Implementar autenticação", projeto: "App Mobile", prioridade: "media", prazo: "Amanhã", icone: "task-chat.svg", cor: "laranja" },
  { id: 3, titulo: "Criar apresentação do projeto", projeto: "Marketing Digital", prioridade: "baixa", prazo: "15 Out", icone: "task-code.svg", cor: "primaria" },
];

export const proximasReunioes = [
  { id: 1, titulo: "Reunião de equipa", quando: "Hoje, 14:00 - 15:00" },
  { id: 2, titulo: "Reunião de planeamento", quando: "Amanhã, 10:00 - 11:00" },
];
