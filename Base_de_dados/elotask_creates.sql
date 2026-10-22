-- phpMyAdmin SQL Dump
-- version 5.1.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:8889
-- Generation Time: Oct 14, 2026 at 09:09 PM
-- Server version: 5.7.24
-- PHP Version: 8.3.1

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

-- --------------------------------------------------------

--
-- Table structure for table `tarefa_responsaveis`
--

CREATE TABLE `tarefa_responsaveis` (
  `id_tarefa` int(10) UNSIGNED NOT NULL,
  `id_utilizador` int(10) UNSIGNED NOT NULL,
  `data_atribuicao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  MODIFY `id_anexo` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `canais`
--
ALTER TABLE `canais`
  MODIFY `id_canal` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chamadas`
--
ALTER TABLE `chamadas`
  MODIFY `id_chamada` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `checklists`
--
ALTER TABLE `checklists`
  MODIFY `id_checklist` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `conversas`
--
ALTER TABLE `conversas`
  MODIFY `id_conversa` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `conversas_ia`
--
ALTER TABLE `conversas_ia`
  MODIFY `id_conversa_ia` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `decisoes_reuniao`
--
ALTER TABLE `decisoes_reuniao`
  MODIFY `id_decisao` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `documentos`
--
ALTER TABLE `documentos`
  MODIFY `id_documento` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `equipas`
--
ALTER TABLE `equipas`
  MODIFY `id_equipa` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `eventos_calendario`
--
ALTER TABLE `eventos_calendario`
  MODIFY `id_evento` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `gravacoes_chamada`
--
ALTER TABLE `gravacoes_chamada`
  MODIFY `id_gravacao` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `historico_alteracoes`
--
ALTER TABLE `historico_alteracoes`
  MODIFY `id_alteracao` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `itens_checklist`
--
ALTER TABLE `itens_checklist`
  MODIFY `id_item` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lembretes_prazos`
--
ALTER TABLE `lembretes_prazos`
  MODIFY `id_lembrete` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `mensagens`
--
ALTER TABLE `mensagens`
  MODIFY `id_mensagem` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `mensagens_ia`
--
ALTER TABLE `mensagens_ia`
  MODIFY `id_mensagem_ia` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notificacoes`
--
ALTER TABLE `notificacoes`
  MODIFY `id_notificacao` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pedidos_ausencia`
--
ALTER TABLE `pedidos_ausencia`
  MODIFY `id_pedido` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `projetos`
--
ALTER TABLE `projetos`
  MODIFY `id_projeto` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `resumos_reunioes`
--
ALTER TABLE `resumos_reunioes`
  MODIFY `id_resumo` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reunioes`
--
ALTER TABLE `reunioes`
  MODIFY `id_reuniao` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sinalizacao_chamada`
--
ALTER TABLE `sinalizacao_chamada`
  MODIFY `id_sinalizacao` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sugestoes_ia`
--
ALTER TABLE `sugestoes_ia`
  MODIFY `id_sugestao` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sugestoes_organizacao`
--
ALTER TABLE `sugestoes_organizacao`
  MODIFY `id_sugestao` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tarefas`
--
ALTER TABLE `tarefas`
  MODIFY `id_tarefa` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `turnos`
--
ALTER TABLE `turnos`
  MODIFY `id_turno` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `utilizadores`
--
ALTER TABLE `utilizadores`
  MODIFY `id_utilizador` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

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

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
