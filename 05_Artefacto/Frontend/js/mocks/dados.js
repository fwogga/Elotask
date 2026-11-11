// Dados de exemplo até o backend estar pronto.
// Os nomes dos campos devem ser combinados com quem faz a API.
// As datas são relativas a hoje, para a demo parecer sempre atual.

function dia(desloc, hora = "09:00") {
  const d = new Date();
  d.setDate(d.getDate() + desloc);
  const [h, m] = hora.split(":");
  d.setHours(Number(h), Number(m), 0, 0);
  return d.toISOString();
}

// Só a data (AAAA-MM-DD), em hora local
function data(desloc) {
  const d = new Date();
  d.setDate(d.getDate() + desloc);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const utilizadorAtualId = 1;

export const utilizadores = [
  { id: 1, nome: "Cássia Baptista", email: "cassia.baptista@elotask.pt", telefone: "+351 912 345 678", nascimento: "2000-02-14", funcao: "Gestora de Projeto", cor: "primaria" },
  { id: 2, nome: "Marlinda Congo", email: "marlinda.congo@elotask.pt", telefone: "+351 913 456 789", nascimento: "1999-06-21", funcao: "Desenvolvedora", cor: "violeta" },
  { id: 3, nome: "Miguel Almeida", email: "miguel.almeida@elotask.pt", telefone: "+351 914 567 890", nascimento: "1998-11-03", funcao: "Desenvolvedor", cor: "menta" },
  { id: 4, nome: "Deuwer Rabelais", email: "deuwer.rabelais@elotask.pt", telefone: "+351 915 678 901", nascimento: "2000-09-30", funcao: "Designer", cor: "laranja" },
];

// estado: "em_andamento" | "planeamento" | "concluido"
export const projetos = [
  {
    id: 1,
    nome: "EloTask Website",
    descricao: "Desenvolvimento de website da plataforma EloTask, incluindo a interface do utilizador, funcionalidades principais e integração com os serviços de backend.",
    objetivos: ["Criar uma interface moderna e intuitiva", "Implementar as funcionalidades essenciais", "Garantir a segurança e desempenho da aplicação"],
    estado: "em_andamento", inicio: data(-30), fim: data(30),
    icone: "proj-globe.svg", cor: "", gestorId: 1, membros: [1, 2, 3, 4],
  },
  {
    id: 2,
    nome: "App Mobile",
    descricao: "Versão móvel do EloTask para Android e iOS, com notificações e acesso rápido às tarefas.",
    objetivos: ["Reutilizar a API do website", "Notificações de tarefas e reuniões"],
    estado: "em_andamento", inicio: data(-20), fim: data(60),
    icone: "proj-mobile.svg", cor: "violeta", gestorId: 2, membros: [2, 3],
  },
  {
    id: 3,
    nome: "Marketing Digital",
    descricao: "Campanha de lançamento do EloTask junto de grupos académicos e pequenas empresas.",
    objetivos: ["Preparar materiais de divulgação", "Definir o plano de redes sociais"],
    estado: "planeamento", inicio: data(5), fim: data(75),
    icone: "proj-megafone.svg", cor: "erro", gestorId: 4, membros: [1, 4],
  },
  {
    id: 4,
    nome: "Investigação",
    descricao: "Estudo sobre ferramentas de colaboração e recolha de requisitos junto dos públicos-alvo.",
    objetivos: ["Inquérito aos públicos-alvo", "Relatório de requisitos"],
    estado: "em_andamento", inicio: data(-45), fim: data(15),
    icone: "proj-pesquisa.svg", cor: "menta", gestorId: 1, membros: [1, 3],
  },
];

// estado: "por_fazer" | "em_progresso" | "concluida"
// prioridade: "alta" | "media" | "baixa"
export const tarefas = [
  { id: 1, titulo: "Criar layout da página inicial", projetoId: 1, responsaveis: [1, 2], prazo: data(0), prioridade: "alta", estado: "por_fazer" },
  { id: 2, titulo: "Implementar login", projetoId: 2, responsaveis: [2, 1], prazo: data(1), prioridade: "media", estado: "por_fazer" },
  { id: 3, titulo: "Rever documentação", projetoId: 4, responsaveis: [1, 3], prazo: data(5), prioridade: "baixa", estado: "por_fazer" },
  { id: 4, titulo: "Desenvolver API", projetoId: 2, responsaveis: [3, 2], prazo: data(-2), prioridade: "alta", estado: "em_progresso" },
  { id: 5, titulo: "Configurar base de dados", projetoId: 1, responsaveis: [3], prazo: data(3), prioridade: "media", estado: "em_progresso" },
  { id: 6, titulo: "Testes de funcionalidades", projetoId: 2, responsaveis: [2, 3], prazo: data(6), prioridade: "media", estado: "em_progresso" },
  { id: 7, titulo: "Design do sistema", projetoId: 1, responsaveis: [4, 1], prazo: data(-12), prioridade: "alta", estado: "concluida" },
  { id: 8, titulo: "Estrutura do projeto", projetoId: 4, responsaveis: [1, 3], prazo: data(-8), prioridade: "media", estado: "concluida" },
  { id: 9, titulo: "Validação com cliente", projetoId: 3, responsaveis: [4], prazo: data(-6), prioridade: "baixa", estado: "concluida" },
  { id: 10, titulo: "Preparar apresentação do projeto", projetoId: 3, responsaveis: [1, 4], prazo: data(9), prioridade: "baixa", estado: "por_fazer" },
];

// projetoId null = reunião geral (todos os projetos)
export const reunioes = [
  { id: 1, titulo: "Reunião de equipa", projetoId: 1, inicio: dia(0, "14:00"), fim: dia(0, "15:00"), local: "https://meet.elotask.pt/equipa", descricao: "Ponto de situação semanal.", participantes: [1, 2, 3, 4], organizadorId: 1 },
  { id: 2, titulo: "Reunião de planeamento", projetoId: null, inicio: dia(1, "10:00"), fim: dia(1, "11:00"), local: "Sala 2.04", descricao: "Planear o próximo sprint.", participantes: [1, 2, 3, 4], organizadorId: 1 },
  { id: 3, titulo: "Sprint Review", projetoId: 2, inicio: dia(4, "14:00"), fim: dia(4, "16:00"), local: "https://meet.elotask.pt/sprint", descricao: "", participantes: [2, 3, 1], organizadorId: 2 },
  { id: 4, titulo: "Reunião com cliente", projetoId: 3, inicio: dia(9, "11:00"), fim: dia(9, "12:00"), local: "https://meet.elotask.pt/cliente", descricao: "Apresentar a proposta de campanha.", participantes: [1, 4, 2], organizadorId: 4 },
  { id: 5, titulo: "Kick-off do website", projetoId: 1, inicio: dia(-28, "10:00"), fim: dia(-28, "11:00"), local: "Sala 1.02", descricao: "", participantes: [1, 2, 3, 4], organizadorId: 1 },
  { id: 6, titulo: "Revisão de requisitos", projetoId: 4, inicio: dia(-7, "15:00"), fim: dia(-7, "16:00"), local: "https://meet.elotask.pt/requisitos", descricao: "", participantes: [1, 3], organizadorId: 1 },
];

// tipo: "grupo" | "direta"
export const conversas = [
  { id: 1, tipo: "grupo", nome: "Equipa EloTask", membros: [1, 2, 3, 4] },
  { id: 2, tipo: "direta", membros: [1, 2] },
  { id: 3, tipo: "direta", membros: [1, 3] },
  { id: 4, tipo: "direta", membros: [1, 4] },
  { id: 5, tipo: "grupo", nome: "Geral", membros: [1, 2, 3, 4] },
  { id: 6, tipo: "grupo", nome: "Marketing Digital", membros: [1, 4] },
];

export const mensagens = [
  { id: 1, conversaId: 1, autorId: 1, texto: "Boa equipa! Vamos reunir hoje às 14:00 para alinharmos o progresso do projeto.", enviadaEm: dia(0, "12:34") },
  { id: 2, conversaId: 1, autorId: 3, texto: "Perfeito! Já preparei os pontos principais.", enviadaEm: dia(0, "12:35") },
  { id: 3, conversaId: 1, autorId: 2, texto: "Ótimo! Vou partilhar o documento com o resumo das tarefas.", enviadaEm: dia(0, "12:38"), anexo: { nome: "Resumo_Tarefas.pdf", tamanho: 2516582 } },
  { id: 4, conversaId: 2, autorId: 2, texto: "Enviado ficheiro, por favor.", enviadaEm: dia(0, "11:20") },
  { id: 5, conversaId: 3, autorId: 3, texto: "Já está a funcionar!", enviadaEm: dia(0, "10:45") },
  { id: 6, conversaId: 4, autorId: 4, texto: "Concordo!", enviadaEm: dia(0, "09:30") },
  { id: 7, conversaId: 5, autorId: 1, texto: "Bem-vindos à plataforma!", enviadaEm: dia(-1, "18:10") },
  { id: 8, conversaId: 6, autorId: 4, texto: "Vamos alinhar a campanha.", enviadaEm: dia(-1, "16:05") },
];

// Mensagens por ler, por conversa, para o utilizador atual
export const naoLidas = { 1: 4 };

// projetoId null = documento pessoal
export const documentos = [
  { id: 1, nome: "Design_Sistema.pdf", projetoId: 1, tamanho: 3145728, modificadoEm: dia(-1, "16:20"), donoId: 4 },
  { id: 2, nome: "API_Documentacao.docx", projetoId: 2, tamanho: 524288, modificadoEm: dia(-3, "11:00"), donoId: 3 },
  { id: 3, nome: "Apresentacao_Projeto.pptx", projetoId: 3, tamanho: 8388608, modificadoEm: dia(-6, "09:45"), donoId: 1 },
  { id: 4, nome: "Requisitos_Funcionais.pdf", projetoId: 4, tamanho: 1048576, modificadoEm: dia(-9, "14:30"), donoId: 1 },
  { id: 5, nome: "Plano_Trabalho.xlsx", projetoId: 1, tamanho: 262144, modificadoEm: dia(-13, "10:15"), donoId: 1 },
  { id: 6, nome: "Notas_Pessoais.docx", projetoId: null, tamanho: 65536, modificadoEm: dia(-2, "21:00"), donoId: 1 },
];
// papel: "Gestora" | "Membro"   cor: "violeta" | "rosa" | "escuro"
export const equipas = [
  { id: 1, nome: "Equipa EloTask", papel: "Gestora", membros: 8, projetos: 4, cor: "violeta", ultima: true },
  { id: 2, nome: "Marketing Digital", papel: "Membro", membros: 6, projetos: 2, cor: "rosa" },
  { id: 3, nome: "Investigação", papel: "Membro", membros: 3, projetos: 1, cor: "escuro" },
];

export const convites = [
  { id: 1, equipa: "Equipa Design", convidadoPor: "Miguel Almeida" },
];
