-- phpMyAdmin SQL Dump
-- version 5.1.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:8889
-- Generation Time: Oct 18, 2026 at 11:55 AM
-- Server version: 5.7.24
-- PHP Version: 8.3.1

CREATE DATABASE IF NOT EXISTS elotask;

USE elotask;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `elotask`
--

-- --------------------------------------------------------

--
-- Table structure for table `anexos_mensagem`
--

CREATE TABLE `anexos_mensagem` (
  `id_anexo` bigint(20) UNSIGNED NOT NULL,
  `id_mensagem` bigint(20) UNSIGNED NOT NULL,
  `nome_ficheiro` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nome_armazenamento` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `caminho_ficheiro` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_mime` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `extensao` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tamanho_bytes` bigint(20) UNSIGNED NOT NULL,
  `data_upload` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `id_carregador` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `anexos_mensagem`
--

INSERT INTO `anexos_mensagem` (`id_anexo`, `id_mensagem`, `nome_ficheiro`, `nome_armazenamento`, `caminho_ficheiro`, `tipo_mime`, `extensao`, `tamanho_bytes`, `data_upload`, `id_carregador`) VALUES
(1, 5, 'modulo-tarefas.txt', 'demo_modulo_tarefas.txt', 'uploads/mensagens/demo_modulo_tarefas.txt', 'text/plain', 'txt', 2048, '2026-10-18 09:16:00', 3);

-- --------------------------------------------------------

--
-- Table structure for table `canais`
--

CREATE TABLE `canais` (
  `id_canal` int(10) UNSIGNED NOT NULL,
  `id_equipa` int(10) UNSIGNED NOT NULL,
  `nome` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci,
  `tipo` enum('publico','privado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'publico',
  `id_criador` int(10) UNSIGNED NOT NULL,
  `data_criacao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `canais`
--

INSERT INTO `canais` (`id_canal`, `id_equipa`, `nome`, `descricao`, `tipo`, `id_criador`, `data_criacao`) VALUES
(1, 1, 'geral', 'Avisos e conversas gerais da equipa de desenvolvimento.', 'publico', 1, '2026-10-01 12:00:00'),
(2, 1, 'desenvolvimento', 'Discussão técnica sobre funcionalidades e código.', 'publico', 3, '2026-10-01 12:10:00'),
(3, 2, 'design', 'Discussões sobre interface e experiência do utilizador.', 'privado', 4, '2026-10-05 12:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `chamadas`
--

CREATE TABLE `chamadas` (
  `id_chamada` bigint(20) UNSIGNED NOT NULL,
  `id_conversa` int(10) UNSIGNED DEFAULT NULL,
  `id_reuniao` int(10) UNSIGNED DEFAULT NULL,
  `id_iniciador` int(10) UNSIGNED NOT NULL,
  `tipo_chamada` enum('voz','video') COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_inicio` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `data_fim` datetime DEFAULT NULL,
  `estado` enum('iniciada','em_curso','terminada','falhada','cancelada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'iniciada',
  `motivo_fim` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `chamadas`
--

INSERT INTO `chamadas` (`id_chamada`, `id_conversa`, `id_reuniao`, `id_iniciador`, `tipo_chamada`, `data_inicio`, `data_fim`, `estado`, `motivo_fim`) VALUES
(1, 1, NULL, 2, 'voz', '2026-10-17 16:00:00', '2026-10-17 16:12:00', 'terminada', 'concluida'),
(2, 2, 1, 1, 'video', '2026-10-20 15:00:00', NULL, 'iniciada', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `checklists`
--

CREATE TABLE `checklists` (
  `id_checklist` int(10) UNSIGNED NOT NULL,
  `id_tarefa` int(10) UNSIGNED NOT NULL,
  `titulo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_criacao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `checklists`
--

INSERT INTO `checklists` (`id_checklist`, `id_tarefa`, `titulo`, `data_criacao`) VALUES
(1, 1, 'Checklist de autenticação', '2026-10-15 09:15:00'),
(2, 2, 'Checklist do módulo de tarefas', '2026-10-15 09:45:00');

-- --------------------------------------------------------

--
-- Table structure for table `conversas`
--

CREATE TABLE `conversas` (
  `id_conversa` int(10) UNSIGNED NOT NULL,
  `nome` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo` enum('individual','grupo') COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_criador` int(10) UNSIGNED NOT NULL,
  `data_criacao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` enum('ativa','arquivada','inativa') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ativa'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `conversas`
--

INSERT INTO `conversas` (`id_conversa`, `nome`, `tipo`, `id_criador`, `data_criacao`, `estado`) VALUES
(1, NULL, 'individual', 2, '2026-10-16 09:00:00', 'ativa'),
(2, 'Equipa do projeto', 'grupo', 1, '2026-10-16 09:30:00', 'ativa');

-- --------------------------------------------------------

--
-- Table structure for table `conversas_ia`
--

CREATE TABLE `conversas_ia` (
  `id_conversa_ia` int(10) UNSIGNED NOT NULL,
  `id_utilizador` int(10) UNSIGNED NOT NULL,
  `id_projeto` int(10) UNSIGNED DEFAULT NULL,
  `data_criacao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `conversas_ia`
--

INSERT INTO `conversas_ia` (`id_conversa_ia`, `id_utilizador`, `id_projeto`, `data_criacao`) VALUES
(1, 2, 1, '2026-10-18 11:00:00'),
(2, 3, 1, '2026-10-18 11:15:00');

-- --------------------------------------------------------

--
-- Table structure for table `decisoes_reuniao`
--

CREATE TABLE `decisoes_reuniao` (
  `id_decisao` int(10) UNSIGNED NOT NULL,
  `id_reuniao` int(10) UNSIGNED NOT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_responsavel` int(10) UNSIGNED DEFAULT NULL,
  `data_decisao` datetime DEFAULT NULL,
  `estado_validacao` enum('pendente','confirmada','rejeitada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendente',
  `data_criacao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `decisoes_reuniao`
--

INSERT INTO `decisoes_reuniao` (`id_decisao`, `id_reuniao`, `descricao`, `id_responsavel`, `data_decisao`, `estado_validacao`, `data_criacao`) VALUES
(1, 1, 'Concluir a validação da autenticação antes de integrar o módulo de tarefas.', 3, '2026-10-20 15:20:00', 'pendente', '2026-10-20 15:25:00'),
(2, 1, 'Preparar uma demonstração interna da aplicação.', 2, '2026-10-20 15:30:00', 'confirmada', '2026-10-20 15:35:00');

-- --------------------------------------------------------

--
-- Table structure for table `documentos`
--

CREATE TABLE `documentos` (
  `id_documento` int(10) UNSIGNED NOT NULL,
  `id_utilizador` int(10) UNSIGNED NOT NULL,
  `id_projeto` int(10) UNSIGNED DEFAULT NULL,
  `nome` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci,
  `caminho_ficheiro` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_mime` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tamanho_bytes` bigint(20) UNSIGNED NOT NULL,
  `data_upload` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `documentos`
--

INSERT INTO `documentos` (`id_documento`, `id_utilizador`, `id_projeto`, `nome`, `descricao`, `caminho_ficheiro`, `tipo_mime`, `tamanho_bytes`, `data_upload`) VALUES
(1, 2, 1, 'Plano do projeto.txt', 'Documento de demonstração com o plano de trabalho.', 'uploads/documentos/plano_projeto.txt', 'text/plain', 4096, '2026-10-17 14:00:00'),
(2, 4, 2, 'Notas do protótipo.txt', 'Notas de demonstração para a revisão da interface.', 'uploads/documentos/notas_prototipo.txt', 'text/plain', 3072, '2026-10-17 14:30:00');

-- --------------------------------------------------------

--
-- Table structure for table `equipas`
--

CREATE TABLE `equipas` (
  `id_equipa` int(10) UNSIGNED NOT NULL,
  `nome` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci,
  `id_criador` int(10) UNSIGNED NOT NULL,
  `data_criacao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `equipas`
--

INSERT INTO `equipas` (`id_equipa`, `nome`, `descricao`, `id_criador`, `data_criacao`) VALUES
(1, 'Desenvolvimento', 'Equipa responsável pelo desenvolvimento do EloTask.', 1, '2026-10-01 10:00:00'),
(2, 'Design e Experiência', 'Equipa responsável pela interface e usabilidade.', 2, '2026-10-01 10:15:00');

-- --------------------------------------------------------

--
-- Table structure for table `eventos_calendario`
--

CREATE TABLE `eventos_calendario` (
  `id_evento` int(10) UNSIGNED NOT NULL,
  `id_criador` int(10) UNSIGNED NOT NULL,
  `titulo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci,
  `data_inicio` datetime NOT NULL,
  `data_fim` datetime NOT NULL,
  `tipo_evento` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_criacao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `eventos_calendario`
--

INSERT INTO `eventos_calendario` (`id_evento`, `id_criador`, `titulo`, `descricao`, `data_inicio`, `data_fim`, `tipo_evento`, `data_criacao`) VALUES
(1, 2, 'Reunião de acompanhamento', 'Reunião semanal da equipa.', '2026-10-20 15:00:00', '2026-10-20 15:45:00', 'reuniao', '2026-10-18 12:10:00'),
(2, 4, 'Revisão do protótipo', 'Rever os ecrãs e recolher comentários.', '2026-10-22 11:00:00', '2026-10-22 12:00:00', 'reuniao', '2026-10-18 12:15:00'),
(3, 1, 'Entrega da versão de teste', 'Data interna para disponibilizar a versão de teste.', '2026-10-30 09:00:00', '2026-10-30 17:00:00', 'prazo', '2026-10-18 12:20:00');

-- --------------------------------------------------------

--
-- Table structure for table `gravacoes_chamada`
--

CREATE TABLE `gravacoes_chamada` (
  `id_gravacao` bigint(20) UNSIGNED NOT NULL,
  `id_chamada` bigint(20) UNSIGNED NOT NULL,
  `caminho_ficheiro` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `formato` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `duracao_segundos` int(10) UNSIGNED DEFAULT NULL,
  `data_gravacao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `gravacoes_chamada`
--

INSERT INTO `gravacoes_chamada` (`id_gravacao`, `id_chamada`, `caminho_ficheiro`, `formato`, `duracao_segundos`, `data_gravacao`) VALUES
(1, 1, 'uploads/chamadas/demo_chamada_1.webm', 'webm', 720, '2026-10-17 16:13:00');

-- --------------------------------------------------------

--
-- Table structure for table `historico_alteracoes`
--

CREATE TABLE `historico_alteracoes` (
  `id_alteracao` bigint(20) UNSIGNED NOT NULL,
  `id_utilizador` int(10) UNSIGNED DEFAULT NULL,
  `id_projeto` int(10) UNSIGNED DEFAULT NULL,
  `id_tarefa` int(10) UNSIGNED DEFAULT NULL,
  `tipo_alteracao` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_alteracao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `historico_alteracoes`
--

INSERT INTO `historico_alteracoes` (`id_alteracao`, `id_utilizador`, `id_projeto`, `id_tarefa`, `tipo_alteracao`, `descricao`, `data_alteracao`) VALUES
(1, 2, 1, 1, 'criacao_tarefa', 'Criou a tarefa Implementar autenticação.', '2026-10-15 09:00:00'),
(2, 3, 1, 1, 'atualizacao_estado', 'Alterou o estado da tarefa para em_curso.', '2026-10-16 10:00:00'),
(3, 4, 2, 6, 'conclusao_tarefa', 'Concluiu os testes de usabilidade.', '2026-10-16 16:30:00');

-- --------------------------------------------------------

--
-- Table structure for table `itens_checklist`
--

CREATE TABLE `itens_checklist` (
  `id_item` int(10) UNSIGNED NOT NULL,
  `id_checklist` int(10) UNSIGNED NOT NULL,
  `descricao` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('por_fazer','a_fazer','feito') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'por_fazer',
  `ordem` int(10) UNSIGNED NOT NULL DEFAULT '1',
  `data_conclusao` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `itens_checklist`
--

INSERT INTO `itens_checklist` (`id_item`, `id_checklist`, `descricao`, `estado`, `ordem`, `data_conclusao`) VALUES
(1, 1, 'Criar formulário de registo', 'feito', 1, '2026-10-16 10:00:00'),
(2, 1, 'Validar o endereço de email', 'a_fazer', 2, NULL),
(3, 1, 'Implementar autenticação segura', 'por_fazer', 3, NULL),
(4, 1, 'Testar o login', 'por_fazer', 4, NULL),
(5, 2, 'Criar formulário de tarefas', 'feito', 1, '2026-10-17 10:00:00'),
(6, 2, 'Implementar edição de tarefas', 'a_fazer', 2, NULL),
(7, 2, 'Atribuir responsáveis', 'por_fazer', 3, NULL),
(8, 2, 'Testar conclusão de tarefas', 'por_fazer', 4, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `lembretes_prazos`
--

CREATE TABLE `lembretes_prazos` (
  `id_lembrete` int(10) UNSIGNED NOT NULL,
  `id_tarefa` int(10) UNSIGNED NOT NULL,
  `id_utilizador` int(10) UNSIGNED NOT NULL,
  `tipo_lembrete` enum('prazo_proximo','prazo_hoje','prazo_ultrapassado') COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_lembrete` datetime NOT NULL,
  `mensagem` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('pendente','enviado','cancelado','falhado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendente',
  `data_envio` datetime DEFAULT NULL,
  `data_criacao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `lembretes_prazos`
--

INSERT INTO `lembretes_prazos` (`id_lembrete`, `id_tarefa`, `id_utilizador`, `tipo_lembrete`, `data_lembrete`, `mensagem`, `estado`, `data_envio`, `data_criacao`) VALUES
(1, 1, 3, 'prazo_proximo', '2026-10-23 09:00:00', 'O prazo da tarefa Implementar autenticação está próximo.', 'pendente', NULL, '2026-10-18 09:00:00'),
(2, 2, 3, 'prazo_proximo', '2026-10-28 09:00:00', 'O prazo do módulo de tarefas está próximo.', 'pendente', NULL, '2026-10-18 09:05:00'),
(3, 3, 5, 'prazo_hoje', '2026-11-05 09:00:00', 'A tarefa Implementar notificações tem o prazo previsto para hoje.', 'pendente', NULL, '2026-10-18 09:10:00'),
(4, 6, 4, 'prazo_ultrapassado', '2026-10-17 09:00:00', 'Confirme que a tarefa de usabilidade foi concluída.', 'enviado', '2026-10-17 09:00:00', '2026-10-16 09:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `membros_canal`
--

CREATE TABLE `membros_canal` (
  `id_canal` int(10) UNSIGNED NOT NULL,
  `id_utilizador` int(10) UNSIGNED NOT NULL,
  `data_entrada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `papel` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `membros_canal`
--

INSERT INTO `membros_canal` (`id_canal`, `id_utilizador`, `data_entrada`, `papel`) VALUES
(1, 1, '2026-10-01 12:00:00', 'administrador'),
(1, 2, '2026-10-01 12:01:00', 'membro'),
(1, 3, '2026-10-01 12:02:00', 'membro'),
(1, 5, '2026-10-01 12:03:00', 'membro'),
(2, 1, '2026-10-01 12:10:00', 'administrador'),
(2, 3, '2026-10-01 12:11:00', 'membro'),
(2, 5, '2026-10-01 12:12:00', 'membro'),
(3, 2, '2026-10-05 12:00:00', 'membro'),
(3, 4, '2026-10-05 12:01:00', 'administrador');

-- --------------------------------------------------------

--
-- Table structure for table `membros_conversa`
--

CREATE TABLE `membros_conversa` (
  `id_conversa` int(10) UNSIGNED NOT NULL,
  `id_utilizador` int(10) UNSIGNED NOT NULL,
  `data_entrada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `data_saida` datetime DEFAULT NULL,
  `papel` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `membros_conversa`
--

INSERT INTO `membros_conversa` (`id_conversa`, `id_utilizador`, `data_entrada`, `data_saida`, `papel`) VALUES
(1, 2, '2026-10-16 09:00:00', NULL, 'membro'),
(1, 3, '2026-10-16 09:00:00', NULL, 'membro'),
(2, 1, '2026-10-16 09:30:00', NULL, 'administrador'),
(2, 2, '2026-10-16 09:30:00', NULL, 'membro'),
(2, 3, '2026-10-16 09:30:00', NULL, 'membro'),
(2, 4, '2026-10-16 09:30:00', NULL, 'membro'),
(2, 5, '2026-10-16 09:30:00', NULL, 'membro');

-- --------------------------------------------------------

--
-- Table structure for table `membros_equipa`
--

CREATE TABLE `membros_equipa` (
  `id_equipa` int(10) UNSIGNED NOT NULL,
  `id_utilizador` int(10) UNSIGNED NOT NULL,
  `funcao` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_entrada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `membros_equipa`
--

INSERT INTO `membros_equipa` (`id_equipa`, `id_utilizador`, `funcao`, `data_entrada`) VALUES
(1, 1, 'Administrador', '2026-10-01 10:00:00'),
(1, 2, 'Gestora de Projetos', '2026-10-01 10:05:00'),
(1, 3, 'Programador', '2026-10-01 10:10:00'),
(1, 5, 'Analista', '2026-10-01 10:15:00'),
(2, 2, 'Coordenadora', '2026-10-01 10:20:00'),
(2, 3, 'Programador de apoio', '2026-10-01 10:30:00'),
(2, 4, 'Designer UI/UX', '2026-10-01 10:25:00');

-- --------------------------------------------------------

--
-- Table structure for table `mensagens`
--

CREATE TABLE `mensagens` (
  `id_mensagem` bigint(20) UNSIGNED NOT NULL,
  `id_conversa` int(10) UNSIGNED DEFAULT NULL,
  `id_canal` int(10) UNSIGNED DEFAULT NULL,
  `id_remetente` int(10) UNSIGNED NOT NULL,
  `conteudo` text COLLATE utf8mb4_unicode_ci,
  `tipo_mensagem` enum('texto','imagem','ficheiro','mista') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'texto',
  `id_mensagem_resposta` bigint(20) UNSIGNED DEFAULT NULL,
  `data_envio` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `data_edicao` datetime DEFAULT NULL,
  `data_eliminacao` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `mensagens`
--

INSERT INTO `mensagens` (`id_mensagem`, `id_conversa`, `id_canal`, `id_remetente`, `conteudo`, `tipo_mensagem`, `id_mensagem_resposta`, `data_envio`, `data_edicao`, `data_eliminacao`) VALUES
(1, 1, NULL, 2, 'Olá João, como está o desenvolvimento da autenticação?', 'texto', NULL, '2026-10-17 09:00:00', NULL, NULL),
(2, 1, NULL, 3, 'Já implementei o formulário e estou a terminar a validação.', 'texto', 1, '2026-10-17 09:03:00', NULL, NULL),
(3, 2, NULL, 1, 'Bom dia equipa. Atualizem o estado das tarefas antes da reunião.', 'texto', NULL, '2026-10-18 09:00:00', NULL, NULL),
(4, NULL, 1, 2, 'A reunião de acompanhamento será hoje às 15h.', 'texto', NULL, '2026-10-18 09:10:00', NULL, NULL),
(5, NULL, 2, 3, 'Vou publicar a versão de teste do módulo de tarefas.', 'texto', NULL, '2026-10-18 09:15:00', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `mensagens_ia`
--

CREATE TABLE `mensagens_ia` (
  `id_mensagem_ia` bigint(20) UNSIGNED NOT NULL,
  `id_conversa_ia` int(10) UNSIGNED NOT NULL,
  `tipo_mensagem` enum('pergunta','resposta') COLLATE utf8mb4_unicode_ci NOT NULL,
  `conteudo` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_criacao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `mensagens_ia`
--

INSERT INTO `mensagens_ia` (`id_mensagem_ia`, `id_conversa_ia`, `tipo_mensagem`, `conteudo`, `data_criacao`) VALUES
(1, 1, 'pergunta', 'Quais são as tarefas prioritárias do projeto?', '2026-10-18 11:00:00'),
(2, 1, 'resposta', 'Com base nos dados de demonstração, a autenticação tem prioridade urgente e o módulo de tarefas tem prioridade alta. Confirme sempre os estados reais no sistema.', '2026-10-18 11:00:05'),
(3, 2, 'pergunta', 'Ajuda-me a organizar a implementação do módulo de tarefas.', '2026-10-18 11:15:00'),
(4, 2, 'resposta', 'Sugestão de demonstração: concluir primeiro a edição, depois a atribuição de responsáveis e, por fim, executar os testes.', '2026-10-18 11:15:05');

-- --------------------------------------------------------

--
-- Table structure for table `notificacoes`
--

CREATE TABLE `notificacoes` (
  `id_notificacao` bigint(20) UNSIGNED NOT NULL,
  `id_utilizador` int(10) UNSIGNED NOT NULL,
  `tipo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `titulo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mensagem` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `entidade_tipo` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entidade_id` bigint(20) UNSIGNED DEFAULT NULL,
  `lida` tinyint(1) NOT NULL DEFAULT '0',
  `data_criacao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `data_leitura` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notificacoes`
--

INSERT INTO `notificacoes` (`id_notificacao`, `id_utilizador`, `tipo`, `titulo`, `mensagem`, `entidade_tipo`, `entidade_id`, `lida`, `data_criacao`, `data_leitura`) VALUES
(1, 3, 'prazo', 'Prazo próximo', 'A tarefa Implementar autenticação aproxima-se do prazo.', 'tarefa', 1, 0, '2026-10-18 12:00:00', NULL),
(2, 2, 'tarefa_atribuida', 'Tarefa atribuída', 'Foi-lhe atribuída uma tarefa no projeto EloTask.', 'tarefa', 1, 1, '2026-10-16 12:00:00', '2026-10-16 12:30:00'),
(3, 4, 'reuniao', 'Convite para reunião', 'Foi convidada para a revisão do protótipo.', 'reuniao', 2, 0, '2026-10-18 12:05:00', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `participantes_chamada`
--

CREATE TABLE `participantes_chamada` (
  `id_chamada` bigint(20) UNSIGNED NOT NULL,
  `id_utilizador` int(10) UNSIGNED NOT NULL,
  `data_entrada` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `data_saida` datetime DEFAULT NULL,
  `estado_participacao` enum('convidado','aceite','recusado','participou','ausente') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'convidado'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `participantes_chamada`
--

INSERT INTO `participantes_chamada` (`id_chamada`, `id_utilizador`, `data_entrada`, `data_saida`, `estado_participacao`) VALUES
(1, 2, '2026-10-17 16:00:00', '2026-10-17 16:12:00', 'participou'),
(1, 3, '2026-10-17 16:00:10', '2026-10-17 16:12:00', 'participou'),
(2, 1, '2026-10-20 15:00:00', NULL, 'aceite'),
(2, 2, '2026-10-20 15:00:00', NULL, 'convidado'),
(2, 3, '2026-10-20 15:00:00', NULL, 'convidado');

-- --------------------------------------------------------

--
-- Table structure for table `pedidos_ausencia`
--

CREATE TABLE `pedidos_ausencia` (
  `id_pedido` int(10) UNSIGNED NOT NULL,
  `id_utilizador` int(10) UNSIGNED NOT NULL,
  `tipo_ausencia` enum('ferias','folga','outra') COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_inicio` date NOT NULL,
  `data_fim` date NOT NULL,
  `motivo` text COLLATE utf8mb4_unicode_ci,
  `estado` enum('pendente','aprovado','rejeitado','cancelado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendente',
  `data_pedido` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `id_aprovador` int(10) UNSIGNED DEFAULT NULL,
  `data_decisao` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `pedidos_ausencia`
--

INSERT INTO `pedidos_ausencia` (`id_pedido`, `id_utilizador`, `tipo_ausencia`, `data_inicio`, `data_fim`, `motivo`, `estado`, `data_pedido`, `id_aprovador`, `data_decisao`) VALUES
(1, 3, 'folga', '2026-11-06', '2026-11-06', 'Pedido de folga para tratar de assuntos pessoais.', 'pendente', '2026-10-18 13:00:00', NULL, NULL),
(2, 4, 'ferias', '2026-12-10', '2026-12-12', 'Pedido de férias.', 'aprovado', '2026-10-10 10:00:00', 1, '2026-10-11 09:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `projetos`
--

CREATE TABLE `projetos` (
  `id_projeto` int(10) UNSIGNED NOT NULL,
  `nome` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci,
  `id_criador` int(10) UNSIGNED NOT NULL,
  `data_inicio` date DEFAULT NULL,
  `data_fim` date DEFAULT NULL,
  `estado` enum('planeado','em_curso','concluido','suspenso','cancelado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'planeado',
  `data_criacao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `projetos`
--

INSERT INTO `projetos` (`id_projeto`, `nome`, `descricao`, `id_criador`, `data_inicio`, `data_fim`, `estado`, `data_criacao`) VALUES
(1, 'Plataforma EloTask', 'Aplicação de comunicação, colaboração e gestão de trabalho.', 1, '2026-10-01', '2026-12-31', 'em_curso', '2026-10-01 11:00:00'),
(2, 'Redesign da Interface', 'Melhorias na interface e experiência do utilizador.', 2, '2026-10-05', '2026-11-30', 'em_curso', '2026-10-05 11:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `projeto_membros`
--

CREATE TABLE `projeto_membros` (
  `id_projeto` int(10) UNSIGNED NOT NULL,
  `id_utilizador` int(10) UNSIGNED NOT NULL,
  `funcao` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_adicao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `projeto_membros`
--

INSERT INTO `projeto_membros` (`id_projeto`, `id_utilizador`, `funcao`, `data_adicao`) VALUES
(1, 1, 'Administrador', '2026-10-01 11:10:00'),
(1, 2, 'Gestora de Projetos', '2026-10-01 11:11:00'),
(1, 3, 'Programador', '2026-10-01 11:12:00'),
(1, 4, 'Designer', '2026-10-01 11:13:00'),
(1, 5, 'Analista', '2026-10-01 11:14:00'),
(2, 2, 'Coordenadora', '2026-10-05 11:10:00'),
(2, 3, 'Programador', '2026-10-05 11:11:00'),
(2, 4, 'Designer UI/UX', '2026-10-05 11:12:00');

-- --------------------------------------------------------

--
-- Table structure for table `resumos_reunioes`
--

CREATE TABLE `resumos_reunioes` (
  `id_resumo` int(10) UNSIGNED NOT NULL,
  `id_reuniao` int(10) UNSIGNED NOT NULL,
  `conteudo_resumo` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `modelo_ia` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `data_geracao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `resumos_reunioes`
--

INSERT INTO `resumos_reunioes` (`id_resumo`, `id_reuniao`, `conteudo_resumo`, `modelo_ia`, `data_geracao`) VALUES
(1, 1, 'Resumo de demonstração: rever o progresso da autenticação, validar o módulo de tarefas e identificar bloqueios. Este texto é fictício e serve para testar a apresentação do resumo.', 'demo-model', '2026-10-18 10:30:00');

-- --------------------------------------------------------

--
-- Table structure for table `reuniao_participantes`
--

CREATE TABLE `reuniao_participantes` (
  `id_reuniao` int(10) UNSIGNED NOT NULL,
  `id_utilizador` int(10) UNSIGNED NOT NULL,
  `estado_convite` enum('pendente','aceite','recusado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendente',
  `data_resposta` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `reuniao_participantes`
--

INSERT INTO `reuniao_participantes` (`id_reuniao`, `id_utilizador`, `estado_convite`, `data_resposta`) VALUES
(1, 1, 'aceite', '2026-10-18 10:20:00'),
(1, 2, 'aceite', '2026-10-18 10:21:00'),
(1, 3, 'aceite', '2026-10-18 10:22:00'),
(1, 5, 'pendente', NULL),
(2, 2, 'aceite', '2026-10-18 10:25:00'),
(2, 3, 'pendente', NULL),
(2, 4, 'aceite', '2026-10-18 10:26:00');

-- --------------------------------------------------------

--
-- Table structure for table `reunioes`
--

CREATE TABLE `reunioes` (
  `id_reuniao` int(10) UNSIGNED NOT NULL,
  `titulo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci,
  `id_criador` int(10) UNSIGNED NOT NULL,
  `data_inicio` datetime NOT NULL,
  `data_fim` datetime NOT NULL,
  `tipo_reuniao` enum('presencial','online') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'online',
  `localizacao` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `link_reuniao` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` enum('agendada','em_curso','concluida','cancelada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'agendada',
  `data_criacao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `reunioes`
--

INSERT INTO `reunioes` (`id_reuniao`, `titulo`, `descricao`, `id_criador`, `data_inicio`, `data_fim`, `tipo_reuniao`, `localizacao`, `link_reuniao`, `estado`, `data_criacao`) VALUES
(1, 'Reunião de acompanhamento', 'Revisão do progresso, bloqueios e próximos passos.', 2, '2026-10-20 15:00:00', '2026-10-20 15:45:00', 'online', NULL, 'https://exemplo.invalid/reuniao-1', 'agendada', '2026-10-18 10:00:00'),
(2, 'Revisão do protótipo', 'Avaliação do protótipo do dashboard.', 4, '2026-10-22 11:00:00', '2026-10-22 12:00:00', 'presencial', 'Sala de reuniões A', NULL, 'agendada', '2026-10-18 10:15:00');

-- --------------------------------------------------------

--
-- Table structure for table `sinalizacao_chamada`
--

CREATE TABLE `sinalizacao_chamada` (
  `id_sinalizacao` bigint(20) UNSIGNED NOT NULL,
  `id_chamada` bigint(20) UNSIGNED NOT NULL,
  `id_remetente` int(10) UNSIGNED NOT NULL,
  `tipo_mensagem` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `conteudo` json NOT NULL,
  `data_criacao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sinalizacao_chamada`
--

INSERT INTO `sinalizacao_chamada` (`id_sinalizacao`, `id_chamada`, `id_remetente`, `tipo_mensagem`, `conteudo`, `data_criacao`) VALUES
(1, 2, 1, 'oferta', '{\"sdp\": \"sdp-de-demonstracao\", \"tipo\": \"video\"}', '2026-10-20 15:00:01'),
(2, 2, 2, 'resposta', '{\"sdp\": \"resposta-de-demonstracao\", \"tipo\": \"video\"}', '2026-10-20 15:00:03');

-- --------------------------------------------------------

--
-- Table structure for table `sugestoes_ia`
--

CREATE TABLE `sugestoes_ia` (
  `id_sugestao` int(10) UNSIGNED NOT NULL,
  `id_projeto` int(10) UNSIGNED DEFAULT NULL,
  `id_utilizador` int(10) UNSIGNED DEFAULT NULL,
  `tipo_sugestao` enum('melhoria','ajuste','organizacao','prioridade') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'melhoria',
  `descricao` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `justificacao` text COLLATE utf8mb4_unicode_ci,
  `estado` enum('pendente','aceite','rejeitada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendente',
  `data_geracao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sugestoes_ia`
--

INSERT INTO `sugestoes_ia` (`id_sugestao`, `id_projeto`, `id_utilizador`, `tipo_sugestao`, `descricao`, `justificacao`, `estado`, `data_geracao`) VALUES
(1, 1, 2, 'prioridade', 'Dar prioridade à validação da autenticação.', 'A autenticação é necessária para proteger o acesso às funcionalidades.', 'pendente', '2026-10-18 11:30:00'),
(2, 1, 3, 'organizacao', 'Dividir o módulo de tarefas em subtarefas menores.', 'Facilita a atribuição de responsabilidades e o acompanhamento do progresso.', 'aceite', '2026-10-18 11:35:00'),
(3, 2, 4, 'melhoria', 'Realizar testes de usabilidade com colaboradores.', 'O feedback dos utilizadores pode revelar problemas de navegação.', 'pendente', '2026-10-18 11:40:00');

-- --------------------------------------------------------

--
-- Table structure for table `sugestoes_organizacao`
--

CREATE TABLE `sugestoes_organizacao` (
  `id_sugestao` int(10) UNSIGNED NOT NULL,
  `id_tarefa` int(10) UNSIGNED NOT NULL,
  `prioridade_atual` enum('baixa','media','alta','urgente') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prioridade_sugerida` enum('baixa','media','alta','urgente') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prazo_atual` date DEFAULT NULL,
  `prazo_sugerido` date DEFAULT NULL,
  `justificacao` text COLLATE utf8mb4_unicode_ci,
  `estado` enum('pendente','aceite','rejeitada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendente',
  `data_geracao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sugestoes_organizacao`
--

INSERT INTO `sugestoes_organizacao` (`id_sugestao`, `id_tarefa`, `prioridade_atual`, `prioridade_sugerida`, `prazo_atual`, `prazo_sugerido`, `justificacao`, `estado`, `data_geracao`) VALUES
(1, 3, 'alta', 'urgente', '2026-11-05', '2026-11-03', 'Antecipar a preparação das notificações para permitir testes integrados.', 'pendente', '2026-10-18 11:45:00'),
(2, 4, 'media', 'alta', '2026-10-28', '2026-10-26', 'Executar testes da base de dados antes da integração final.', 'pendente', '2026-10-18 11:50:00');

-- --------------------------------------------------------

--
-- Table structure for table `tarefas`
--

CREATE TABLE `tarefas` (
  `id_tarefa` int(10) UNSIGNED NOT NULL,
  `id_projeto` int(10) UNSIGNED NOT NULL,
  `id_criador` int(10) UNSIGNED NOT NULL,
  `titulo` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci,
  `prioridade` enum('baixa','media','alta','urgente') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'media',
  `estado` enum('pendente','em_curso','concluida','cancelada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendente',
  `data_criacao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `data_inicio` date DEFAULT NULL,
  `prazo` date DEFAULT NULL,
  `data_conclusao` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tarefas`
--

INSERT INTO `tarefas` (`id_tarefa`, `id_projeto`, `id_criador`, `titulo`, `descricao`, `prioridade`, `estado`, `data_criacao`, `data_inicio`, `prazo`, `data_conclusao`) VALUES
(1, 1, 2, 'Implementar autenticação', 'Implementar registo, login e controlo de acesso.', 'urgente', 'em_curso', '2026-10-15 09:00:00', '2026-10-15', '2026-10-25', NULL),
(2, 1, 3, 'Desenvolver módulo de tarefas', 'Criar, editar, atribuir e concluir tarefas.', 'alta', 'em_curso', '2026-10-15 09:30:00', '2026-10-16', '2026-10-30', NULL),
(3, 1, 5, 'Implementar notificações', 'Notificar os colaboradores sobre tarefas e prazos.', 'alta', 'pendente', '2026-10-16 10:00:00', '2026-10-20', '2026-11-05', NULL),
(4, 1, 5, 'Testar a base de dados', 'Validar relações, restrições e integridade dos dados.', 'media', 'pendente', '2026-10-16 11:00:00', '2026-10-18', '2026-10-28', NULL),
(5, 2, 4, 'Criar protótipo do dashboard', 'Desenhar o dashboard e os componentes principais.', 'alta', 'em_curso', '2026-10-15 12:00:00', '2026-10-15', '2026-10-27', NULL),
(6, 2, 4, 'Testar usabilidade', 'Recolher feedback e identificar melhorias.', 'media', 'concluida', '2026-10-10 12:00:00', '2026-10-10', '2026-10-16', '2026-10-16 16:30:00');

-- --------------------------------------------------------

--
-- Table structure for table `tarefa_responsaveis`
--

CREATE TABLE `tarefa_responsaveis` (
  `id_tarefa` int(10) UNSIGNED NOT NULL,
  `id_utilizador` int(10) UNSIGNED NOT NULL,
  `data_atribuicao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tarefa_responsaveis`
--

INSERT INTO `tarefa_responsaveis` (`id_tarefa`, `id_utilizador`, `data_atribuicao`) VALUES
(1, 2, '2026-10-15 09:06:00'),
(1, 3, '2026-10-15 09:05:00'),
(2, 3, '2026-10-15 09:35:00'),
(3, 5, '2026-10-16 10:05:00'),
(4, 5, '2026-10-16 11:05:00'),
(5, 4, '2026-10-15 12:05:00'),
(6, 2, '2026-10-10 12:06:00'),
(6, 4, '2026-10-10 12:05:00');

-- --------------------------------------------------------

--
-- Table structure for table `turnos`
--

CREATE TABLE `turnos` (
  `id_turno` int(10) UNSIGNED NOT NULL,
  `nome` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fim` time NOT NULL,
  `data_turno` date NOT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `turnos`
--

INSERT INTO `turnos` (`id_turno`, `nome`, `hora_inicio`, `hora_fim`, `data_turno`, `descricao`) VALUES
(1, 'Turno da manhã', '09:00:00', '13:00:00', '2026-10-19', 'Turno de trabalho da manhã.'),
(2, 'Turno da tarde', '14:00:00', '18:00:00', '2026-10-19', 'Turno de trabalho da tarde.');

-- --------------------------------------------------------

--
-- Table structure for table `turno_colaboradores`
--

CREATE TABLE `turno_colaboradores` (
  `id_turno` int(10) UNSIGNED NOT NULL,
  `id_utilizador` int(10) UNSIGNED NOT NULL,
  `estado` enum('atribuido','confirmado','cancelado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'atribuido',
  `data_atribuicao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `turno_colaboradores`
--

INSERT INTO `turno_colaboradores` (`id_turno`, `id_utilizador`, `estado`, `data_atribuicao`) VALUES
(1, 2, 'confirmado', '2026-10-18 14:00:00'),
(1, 3, 'confirmado', '2026-10-18 14:05:00'),
(2, 4, 'atribuido', '2026-10-18 14:10:00'),
(2, 5, 'atribuido', '2026-10-18 14:15:00');

-- --------------------------------------------------------

--
-- Table structure for table `utilizadores`
--

CREATE TABLE `utilizadores` (
  `id_utilizador` int(10) UNSIGNED NOT NULL,
  `nome` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_utilizador` enum('admin','colaborador') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'colaborador',
  `telefone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto_perfil` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cargo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` enum('ativo','inativo','suspenso') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ativo',
  `data_criacao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `data_atualizacao` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `utilizadores`
--

INSERT INTO `utilizadores` (`id_utilizador`, `nome`, `email`, `password_hash`, `tipo_utilizador`, `telefone`, `foto_perfil`, `cargo`, `estado`, `data_criacao`, `data_atualizacao`) VALUES
(1, 'Administrador EloTask', 'admin@elotask.pt', 'HASH_DE_TESTE_NAO_UTILIZAR_NO_LOGIN', 'admin', '910000001', NULL, 'Administrador', 'ativo', '2026-10-01 09:00:00', NULL),
(2, 'Ana Silva', 'ana.silva@elotask.pt', 'HASH_DE_TESTE_NAO_UTILIZAR_NO_LOGIN', 'colaborador', '910000002', NULL, 'Gestora de Projetos', 'ativo', '2026-10-01 09:05:00', NULL),
(3, 'João Costa', 'joao.costa@elotask.pt', 'HASH_DE_TESTE_NAO_UTILIZAR_NO_LOGIN', 'colaborador', '910000003', NULL, 'Programador', 'ativo', '2026-10-01 09:10:00', NULL),
(4, 'Maria Fernandes', 'maria.fernandes@elotask.pt', 'HASH_DE_TESTE_NAO_UTILIZAR_NO_LOGIN', 'colaborador', '910000004', NULL, 'Designer UI/UX', 'ativo', '2026-10-01 09:15:00', NULL),
(5, 'Pedro Santos', 'pedro.santos@elotask.pt', 'HASH_DE_TESTE_NAO_UTILIZAR_NO_LOGIN', 'colaborador', '910000005', NULL, 'Analista de Sistemas', 'ativo', '2026-10-01 09:20:00', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `anexos_mensagem`
--
ALTER TABLE `anexos_mensagem`
  ADD PRIMARY KEY (`id_anexo`),
  ADD KEY `fk_anexos_mensagem_carregador` (`id_carregador`),
  ADD KEY `idx_anexos_mensagem` (`id_mensagem`);

--
-- Indexes for table `canais`
--
ALTER TABLE `canais`
  ADD PRIMARY KEY (`id_canal`),
  ADD UNIQUE KEY `uq_canal_nome_equipa` (`id_equipa`,`nome`),
  ADD KEY `fk_canais_criador` (`id_criador`);

--
-- Indexes for table `chamadas`
--
ALTER TABLE `chamadas`
  ADD PRIMARY KEY (`id_chamada`),
  ADD KEY `fk_chamadas_conversa` (`id_conversa`),
  ADD KEY `fk_chamadas_reuniao` (`id_reuniao`),
  ADD KEY `fk_chamadas_iniciador` (`id_iniciador`),
  ADD KEY `idx_chamadas_data_inicio` (`data_inicio`);

--
-- Indexes for table `checklists`
--
ALTER TABLE `checklists`
  ADD PRIMARY KEY (`id_checklist`),
  ADD KEY `fk_checklists_tarefa` (`id_tarefa`);

--
-- Indexes for table `conversas`
--
ALTER TABLE `conversas`
  ADD PRIMARY KEY (`id_conversa`),
  ADD KEY `fk_conversas_criador` (`id_criador`);

--
-- Indexes for table `conversas_ia`
--
ALTER TABLE `conversas_ia`
  ADD PRIMARY KEY (`id_conversa_ia`),
  ADD KEY `fk_conversas_ia_projeto` (`id_projeto`),
  ADD KEY `idx_conversas_ia_utilizador_data` (`id_utilizador`,`data_criacao`);

--
-- Indexes for table `decisoes_reuniao`
--
ALTER TABLE `decisoes_reuniao`
  ADD PRIMARY KEY (`id_decisao`),
  ADD KEY `fk_decisoes_reuniao_responsavel` (`id_responsavel`),
  ADD KEY `idx_decisoes_reuniao_estado` (`id_reuniao`,`estado_validacao`);

--
-- Indexes for table `documentos`
--
ALTER TABLE `documentos`
  ADD PRIMARY KEY (`id_documento`),
  ADD KEY `fk_documentos_utilizador` (`id_utilizador`),
  ADD KEY `fk_documentos_projeto` (`id_projeto`);

--
-- Indexes for table `equipas`
--
ALTER TABLE `equipas`
  ADD PRIMARY KEY (`id_equipa`),
  ADD KEY `fk_equipas_criador` (`id_criador`);

--
-- Indexes for table `eventos_calendario`
--
ALTER TABLE `eventos_calendario`
  ADD PRIMARY KEY (`id_evento`),
  ADD KEY `fk_eventos_calendario_criador` (`id_criador`),
  ADD KEY `idx_eventos_data_inicio` (`data_inicio`);

--
-- Indexes for table `gravacoes_chamada`
--
ALTER TABLE `gravacoes_chamada`
  ADD PRIMARY KEY (`id_gravacao`),
  ADD KEY `fk_gravacoes_chamada` (`id_chamada`);

--
-- Indexes for table `historico_alteracoes`
--
ALTER TABLE `historico_alteracoes`
  ADD PRIMARY KEY (`id_alteracao`),
  ADD KEY `fk_historico_alteracoes_utilizador` (`id_utilizador`),
  ADD KEY `idx_historico_alteracoes_projeto_data` (`id_projeto`,`data_alteracao`),
  ADD KEY `idx_historico_alteracoes_tarefa_data` (`id_tarefa`,`data_alteracao`);

--
-- Indexes for table `itens_checklist`
--
ALTER TABLE `itens_checklist`
  ADD PRIMARY KEY (`id_item`),
  ADD KEY `fk_itens_checklist_checklist` (`id_checklist`);

--
-- Indexes for table `lembretes_prazos`
--
ALTER TABLE `lembretes_prazos`
  ADD PRIMARY KEY (`id_lembrete`),
  ADD KEY `fk_lembretes_prazos_tarefa` (`id_tarefa`),
  ADD KEY `idx_lembretes_estado_data` (`estado`,`data_lembrete`),
  ADD KEY `idx_lembretes_utilizador` (`id_utilizador`,`data_lembrete`);

--
-- Indexes for table `membros_canal`
--
ALTER TABLE `membros_canal`
  ADD PRIMARY KEY (`id_canal`,`id_utilizador`),
  ADD KEY `fk_membros_canal_utilizador` (`id_utilizador`);

--
-- Indexes for table `membros_conversa`
--
ALTER TABLE `membros_conversa`
  ADD PRIMARY KEY (`id_conversa`,`id_utilizador`),
  ADD KEY `fk_membros_conversa_utilizador` (`id_utilizador`);

--
-- Indexes for table `membros_equipa`
--
ALTER TABLE `membros_equipa`
  ADD PRIMARY KEY (`id_equipa`,`id_utilizador`),
  ADD KEY `fk_membros_equipa_utilizador` (`id_utilizador`);

--
-- Indexes for table `mensagens`
--
ALTER TABLE `mensagens`
  ADD PRIMARY KEY (`id_mensagem`),
  ADD KEY `fk_mensagens_resposta` (`id_mensagem_resposta`),
  ADD KEY `idx_mensagens_conversa_data` (`id_conversa`,`data_envio`),
  ADD KEY `idx_mensagens_canal_data` (`id_canal`,`data_envio`),
  ADD KEY `idx_mensagens_remetente` (`id_remetente`);

--
-- Indexes for table `mensagens_ia`
--
ALTER TABLE `mensagens_ia`
  ADD PRIMARY KEY (`id_mensagem_ia`),
  ADD KEY `idx_mensagens_ia_conversa_data` (`id_conversa_ia`,`data_criacao`);

--
-- Indexes for table `notificacoes`
--
ALTER TABLE `notificacoes`
  ADD PRIMARY KEY (`id_notificacao`),
  ADD KEY `idx_notificacoes_utilizador_lida` (`id_utilizador`,`lida`,`data_criacao`);

--
-- Indexes for table `participantes_chamada`
--
ALTER TABLE `participantes_chamada`
  ADD PRIMARY KEY (`id_chamada`,`id_utilizador`),
  ADD KEY `fk_participantes_chamada_utilizador` (`id_utilizador`);

--
-- Indexes for table `pedidos_ausencia`
--
ALTER TABLE `pedidos_ausencia`
  ADD PRIMARY KEY (`id_pedido`),
  ADD KEY `fk_pedidos_ausencia_utilizador` (`id_utilizador`),
  ADD KEY `fk_pedidos_ausencia_aprovador` (`id_aprovador`),
  ADD KEY `idx_ausencias_datas` (`data_inicio`,`data_fim`);

--
-- Indexes for table `projetos`
--
ALTER TABLE `projetos`
  ADD PRIMARY KEY (`id_projeto`),
  ADD KEY `fk_projetos_criador` (`id_criador`),
  ADD KEY `idx_projetos_estado` (`estado`);

--
-- Indexes for table `projeto_membros`
--
ALTER TABLE `projeto_membros`
  ADD PRIMARY KEY (`id_projeto`,`id_utilizador`),
  ADD KEY `fk_projeto_membros_utilizador` (`id_utilizador`);

--
-- Indexes for table `resumos_reunioes`
--
ALTER TABLE `resumos_reunioes`
  ADD PRIMARY KEY (`id_resumo`),
  ADD KEY `idx_resumos_reuniao_data` (`id_reuniao`,`data_geracao`);

--
-- Indexes for table `reuniao_participantes`
--
ALTER TABLE `reuniao_participantes`
  ADD PRIMARY KEY (`id_reuniao`,`id_utilizador`),
  ADD KEY `fk_reuniao_participantes_utilizador` (`id_utilizador`);

--
-- Indexes for table `reunioes`
--
ALTER TABLE `reunioes`
  ADD PRIMARY KEY (`id_reuniao`),
  ADD KEY `fk_reunioes_criador` (`id_criador`),
  ADD KEY `idx_reunioes_data_inicio` (`data_inicio`);

--
-- Indexes for table `sinalizacao_chamada`
--
ALTER TABLE `sinalizacao_chamada`
  ADD PRIMARY KEY (`id_sinalizacao`),
  ADD KEY `fk_sinalizacao_remetente` (`id_remetente`),
  ADD KEY `idx_sinalizacao_chamada_data` (`id_chamada`,`data_criacao`);

--
-- Indexes for table `sugestoes_ia`
--
ALTER TABLE `sugestoes_ia`
  ADD PRIMARY KEY (`id_sugestao`),
  ADD KEY `fk_sugestoes_ia_utilizador` (`id_utilizador`),
  ADD KEY `idx_sugestoes_ia_estado` (`estado`),
  ADD KEY `idx_sugestoes_ia_projeto` (`id_projeto`);

--
-- Indexes for table `sugestoes_organizacao`
--
ALTER TABLE `sugestoes_organizacao`
  ADD PRIMARY KEY (`id_sugestao`),
  ADD KEY `idx_sugestoes_organizacao_tarefa_estado` (`id_tarefa`,`estado`);

--
-- Indexes for table `tarefas`
--
ALTER TABLE `tarefas`
  ADD PRIMARY KEY (`id_tarefa`),
  ADD KEY `fk_tarefas_criador` (`id_criador`),
  ADD KEY `idx_tarefas_projeto_estado` (`id_projeto`,`estado`),
  ADD KEY `idx_tarefas_prazo` (`prazo`);

--
-- Indexes for table `tarefa_responsaveis`
--
ALTER TABLE `tarefa_responsaveis`
  ADD PRIMARY KEY (`id_tarefa`,`id_utilizador`),
  ADD KEY `fk_tarefa_responsaveis_utilizador` (`id_utilizador`);

--
-- Indexes for table `turnos`
--
ALTER TABLE `turnos`
  ADD PRIMARY KEY (`id_turno`);

--
-- Indexes for table `turno_colaboradores`
--
ALTER TABLE `turno_colaboradores`
  ADD PRIMARY KEY (`id_turno`,`id_utilizador`),
  ADD KEY `fk_turno_colaboradores_utilizador` (`id_utilizador`);

--
-- Indexes for table `utilizadores`
--
ALTER TABLE `utilizadores`
  ADD PRIMARY KEY (`id_utilizador`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `anexos_mensagem`
--
ALTER TABLE `anexos_mensagem`
  MODIFY `id_anexo` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `canais`
--
ALTER TABLE `canais`
  MODIFY `id_canal` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `chamadas`
--
ALTER TABLE `chamadas`
  MODIFY `id_chamada` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `checklists`
--
ALTER TABLE `checklists`
  MODIFY `id_checklist` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `conversas`
--
ALTER TABLE `conversas`
  MODIFY `id_conversa` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `conversas_ia`
--
ALTER TABLE `conversas_ia`
  MODIFY `id_conversa_ia` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `decisoes_reuniao`
--
ALTER TABLE `decisoes_reuniao`
  MODIFY `id_decisao` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `documentos`
--
ALTER TABLE `documentos`
  MODIFY `id_documento` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `equipas`
--
ALTER TABLE `equipas`
  MODIFY `id_equipa` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `eventos_calendario`
--
ALTER TABLE `eventos_calendario`
  MODIFY `id_evento` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `gravacoes_chamada`
--
ALTER TABLE `gravacoes_chamada`
  MODIFY `id_gravacao` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `historico_alteracoes`
--
ALTER TABLE `historico_alteracoes`
  MODIFY `id_alteracao` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `itens_checklist`
--
ALTER TABLE `itens_checklist`
  MODIFY `id_item` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `lembretes_prazos`
--
ALTER TABLE `lembretes_prazos`
  MODIFY `id_lembrete` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `mensagens`
--
ALTER TABLE `mensagens`
  MODIFY `id_mensagem` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `mensagens_ia`
--
ALTER TABLE `mensagens_ia`
  MODIFY `id_mensagem_ia` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `notificacoes`
--
ALTER TABLE `notificacoes`
  MODIFY `id_notificacao` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `pedidos_ausencia`
--
ALTER TABLE `pedidos_ausencia`
  MODIFY `id_pedido` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `projetos`
--
ALTER TABLE `projetos`
  MODIFY `id_projeto` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `resumos_reunioes`
--
ALTER TABLE `resumos_reunioes`
  MODIFY `id_resumo` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `reunioes`
--
ALTER TABLE `reunioes`
  MODIFY `id_reuniao` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `sinalizacao_chamada`
--
ALTER TABLE `sinalizacao_chamada`
  MODIFY `id_sinalizacao` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `sugestoes_ia`
--
ALTER TABLE `sugestoes_ia`
  MODIFY `id_sugestao` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `sugestoes_organizacao`
--
ALTER TABLE `sugestoes_organizacao`
  MODIFY `id_sugestao` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tarefas`
--
ALTER TABLE `tarefas`
  MODIFY `id_tarefa` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `turnos`
--
ALTER TABLE `turnos`
  MODIFY `id_turno` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `utilizadores`
--
ALTER TABLE `utilizadores`
  MODIFY `id_utilizador` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `anexos_mensagem`
--
ALTER TABLE `anexos_mensagem`
  ADD CONSTRAINT `fk_anexos_mensagem_carregador` FOREIGN KEY (`id_carregador`) REFERENCES `utilizadores` (`id_utilizador`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_anexos_mensagem_mensagem` FOREIGN KEY (`id_mensagem`) REFERENCES `mensagens` (`id_mensagem`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `canais`
--
ALTER TABLE `canais`
  ADD CONSTRAINT `fk_canais_criador` FOREIGN KEY (`id_criador`) REFERENCES `utilizadores` (`id_utilizador`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_canais_equipa` FOREIGN KEY (`id_equipa`) REFERENCES `equipas` (`id_equipa`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `chamadas`
--
ALTER TABLE `chamadas`
  ADD CONSTRAINT `fk_chamadas_conversa` FOREIGN KEY (`id_conversa`) REFERENCES `conversas` (`id_conversa`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_chamadas_iniciador` FOREIGN KEY (`id_iniciador`) REFERENCES `utilizadores` (`id_utilizador`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_chamadas_reuniao` FOREIGN KEY (`id_reuniao`) REFERENCES `reunioes` (`id_reuniao`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `checklists`
--
ALTER TABLE `checklists`
  ADD CONSTRAINT `fk_checklists_tarefa` FOREIGN KEY (`id_tarefa`) REFERENCES `tarefas` (`id_tarefa`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `conversas`
--
ALTER TABLE `conversas`
  ADD CONSTRAINT `fk_conversas_criador` FOREIGN KEY (`id_criador`) REFERENCES `utilizadores` (`id_utilizador`) ON UPDATE CASCADE;

--
-- Constraints for table `conversas_ia`
--
ALTER TABLE `conversas_ia`
  ADD CONSTRAINT `fk_conversas_ia_projeto` FOREIGN KEY (`id_projeto`) REFERENCES `projetos` (`id_projeto`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_conversas_ia_utilizador` FOREIGN KEY (`id_utilizador`) REFERENCES `utilizadores` (`id_utilizador`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `decisoes_reuniao`
--
ALTER TABLE `decisoes_reuniao`
  ADD CONSTRAINT `fk_decisoes_reuniao_responsavel` FOREIGN KEY (`id_responsavel`) REFERENCES `utilizadores` (`id_utilizador`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_decisoes_reuniao_reuniao` FOREIGN KEY (`id_reuniao`) REFERENCES `reunioes` (`id_reuniao`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `documentos`
--
ALTER TABLE `documentos`
  ADD CONSTRAINT `fk_documentos_projeto` FOREIGN KEY (`id_projeto`) REFERENCES `projetos` (`id_projeto`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_documentos_utilizador` FOREIGN KEY (`id_utilizador`) REFERENCES `utilizadores` (`id_utilizador`) ON UPDATE CASCADE;

--
-- Constraints for table `equipas`
--
ALTER TABLE `equipas`
  ADD CONSTRAINT `fk_equipas_criador` FOREIGN KEY (`id_criador`) REFERENCES `utilizadores` (`id_utilizador`) ON UPDATE CASCADE;

--
-- Constraints for table `eventos_calendario`
--
ALTER TABLE `eventos_calendario`
  ADD CONSTRAINT `fk_eventos_calendario_criador` FOREIGN KEY (`id_criador`) REFERENCES `utilizadores` (`id_utilizador`) ON UPDATE CASCADE;

--
-- Constraints for table `gravacoes_chamada`
--
ALTER TABLE `gravacoes_chamada`
  ADD CONSTRAINT `fk_gravacoes_chamada` FOREIGN KEY (`id_chamada`) REFERENCES `chamadas` (`id_chamada`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `historico_alteracoes`
--
ALTER TABLE `historico_alteracoes`
  ADD CONSTRAINT `fk_historico_alteracoes_projeto` FOREIGN KEY (`id_projeto`) REFERENCES `projetos` (`id_projeto`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_historico_alteracoes_tarefa` FOREIGN KEY (`id_tarefa`) REFERENCES `tarefas` (`id_tarefa`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_historico_alteracoes_utilizador` FOREIGN KEY (`id_utilizador`) REFERENCES `utilizadores` (`id_utilizador`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `itens_checklist`
--
ALTER TABLE `itens_checklist`
  ADD CONSTRAINT `fk_itens_checklist_checklist` FOREIGN KEY (`id_checklist`) REFERENCES `checklists` (`id_checklist`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `lembretes_prazos`
--
ALTER TABLE `lembretes_prazos`
  ADD CONSTRAINT `fk_lembretes_prazos_tarefa` FOREIGN KEY (`id_tarefa`) REFERENCES `tarefas` (`id_tarefa`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_lembretes_prazos_utilizador` FOREIGN KEY (`id_utilizador`) REFERENCES `utilizadores` (`id_utilizador`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `membros_canal`
--
ALTER TABLE `membros_canal`
  ADD CONSTRAINT `fk_membros_canal_canal` FOREIGN KEY (`id_canal`) REFERENCES `canais` (`id_canal`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_membros_canal_utilizador` FOREIGN KEY (`id_utilizador`) REFERENCES `utilizadores` (`id_utilizador`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `membros_conversa`
--
ALTER TABLE `membros_conversa`
  ADD CONSTRAINT `fk_membros_conversa_conversa` FOREIGN KEY (`id_conversa`) REFERENCES `conversas` (`id_conversa`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_membros_conversa_utilizador` FOREIGN KEY (`id_utilizador`) REFERENCES `utilizadores` (`id_utilizador`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `membros_equipa`
--
ALTER TABLE `membros_equipa`
  ADD CONSTRAINT `fk_membros_equipa_equipa` FOREIGN KEY (`id_equipa`) REFERENCES `equipas` (`id_equipa`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_membros_equipa_utilizador` FOREIGN KEY (`id_utilizador`) REFERENCES `utilizadores` (`id_utilizador`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `mensagens`
--
ALTER TABLE `mensagens`
  ADD CONSTRAINT `fk_mensagens_canal` FOREIGN KEY (`id_canal`) REFERENCES `canais` (`id_canal`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_mensagens_conversa` FOREIGN KEY (`id_conversa`) REFERENCES `conversas` (`id_conversa`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_mensagens_remetente` FOREIGN KEY (`id_remetente`) REFERENCES `utilizadores` (`id_utilizador`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_mensagens_resposta` FOREIGN KEY (`id_mensagem_resposta`) REFERENCES `mensagens` (`id_mensagem`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `mensagens_ia`
--
ALTER TABLE `mensagens_ia`
  ADD CONSTRAINT `fk_mensagens_ia_conversa` FOREIGN KEY (`id_conversa_ia`) REFERENCES `conversas_ia` (`id_conversa_ia`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `notificacoes`
--
ALTER TABLE `notificacoes`
  ADD CONSTRAINT `fk_notificacoes_utilizador` FOREIGN KEY (`id_utilizador`) REFERENCES `utilizadores` (`id_utilizador`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `participantes_chamada`
--
ALTER TABLE `participantes_chamada`
  ADD CONSTRAINT `fk_participantes_chamada_chamada` FOREIGN KEY (`id_chamada`) REFERENCES `chamadas` (`id_chamada`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_participantes_chamada_utilizador` FOREIGN KEY (`id_utilizador`) REFERENCES `utilizadores` (`id_utilizador`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `pedidos_ausencia`
--
ALTER TABLE `pedidos_ausencia`
  ADD CONSTRAINT `fk_pedidos_ausencia_aprovador` FOREIGN KEY (`id_aprovador`) REFERENCES `utilizadores` (`id_utilizador`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pedidos_ausencia_utilizador` FOREIGN KEY (`id_utilizador`) REFERENCES `utilizadores` (`id_utilizador`) ON UPDATE CASCADE;

--
-- Constraints for table `projetos`
--
ALTER TABLE `projetos`
  ADD CONSTRAINT `fk_projetos_criador` FOREIGN KEY (`id_criador`) REFERENCES `utilizadores` (`id_utilizador`) ON UPDATE CASCADE;

--
-- Constraints for table `projeto_membros`
--
ALTER TABLE `projeto_membros`
  ADD CONSTRAINT `fk_projeto_membros_projeto` FOREIGN KEY (`id_projeto`) REFERENCES `projetos` (`id_projeto`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_projeto_membros_utilizador` FOREIGN KEY (`id_utilizador`) REFERENCES `utilizadores` (`id_utilizador`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `resumos_reunioes`
--
ALTER TABLE `resumos_reunioes`
  ADD CONSTRAINT `fk_resumos_reunioes_reuniao` FOREIGN KEY (`id_reuniao`) REFERENCES `reunioes` (`id_reuniao`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `reuniao_participantes`
--
ALTER TABLE `reuniao_participantes`
  ADD CONSTRAINT `fk_reuniao_participantes_reuniao` FOREIGN KEY (`id_reuniao`) REFERENCES `reunioes` (`id_reuniao`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reuniao_participantes_utilizador` FOREIGN KEY (`id_utilizador`) REFERENCES `utilizadores` (`id_utilizador`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `reunioes`
--
ALTER TABLE `reunioes`
  ADD CONSTRAINT `fk_reunioes_criador` FOREIGN KEY (`id_criador`) REFERENCES `utilizadores` (`id_utilizador`) ON UPDATE CASCADE;

--
-- Constraints for table `sinalizacao_chamada`
--
ALTER TABLE `sinalizacao_chamada`
  ADD CONSTRAINT `fk_sinalizacao_chamada` FOREIGN KEY (`id_chamada`) REFERENCES `chamadas` (`id_chamada`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_sinalizacao_remetente` FOREIGN KEY (`id_remetente`) REFERENCES `utilizadores` (`id_utilizador`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `sugestoes_ia`
--
ALTER TABLE `sugestoes_ia`
  ADD CONSTRAINT `fk_sugestoes_ia_projeto` FOREIGN KEY (`id_projeto`) REFERENCES `projetos` (`id_projeto`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_sugestoes_ia_utilizador` FOREIGN KEY (`id_utilizador`) REFERENCES `utilizadores` (`id_utilizador`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `sugestoes_organizacao`
--
ALTER TABLE `sugestoes_organizacao`
  ADD CONSTRAINT `fk_sugestoes_organizacao_tarefa` FOREIGN KEY (`id_tarefa`) REFERENCES `tarefas` (`id_tarefa`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tarefas`
--
ALTER TABLE `tarefas`
  ADD CONSTRAINT `fk_tarefas_criador` FOREIGN KEY (`id_criador`) REFERENCES `utilizadores` (`id_utilizador`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tarefas_projeto` FOREIGN KEY (`id_projeto`) REFERENCES `projetos` (`id_projeto`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tarefa_responsaveis`
--
ALTER TABLE `tarefa_responsaveis`
  ADD CONSTRAINT `fk_tarefa_responsaveis_tarefa` FOREIGN KEY (`id_tarefa`) REFERENCES `tarefas` (`id_tarefa`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tarefa_responsaveis_utilizador` FOREIGN KEY (`id_utilizador`) REFERENCES `utilizadores` (`id_utilizador`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `turno_colaboradores`
--
ALTER TABLE `turno_colaboradores`
  ADD CONSTRAINT `fk_turno_colaboradores_turno` FOREIGN KEY (`id_turno`) REFERENCES `turnos` (`id_turno`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_turno_colaboradores_utilizador` FOREIGN KEY (`id_utilizador`) REFERENCES `utilizadores` (`id_utilizador`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

-- New alterations

ALTER TABLE utilizadores
MODIFY COLUMN tipo_utilizador
ENUM('admin', 'gestor', 'colaborador')
NOT NULL DEFAULT 'colaborador';

ALTER TABLE equipas
ADD COLUMN estado ENUM('ativa', 'inativa')
NOT NULL DEFAULT 'ativa';

ALTER TABLE membros_equipa
ADD COLUMN estado ENUM('ativo', 'inativo')
NOT NULL DEFAULT 'ativo';

ALTER TABLE projeto_membros
ADD COLUMN estado ENUM('ativo', 'inativo')
NOT NULL DEFAULT 'ativo';

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
