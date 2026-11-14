-- Dados para a apresentação da 2.ª entrega (13/11/2026).
-- Junta-se aos dados de 01_elotask.sql: põe os prazos em datas atuais e acrescenta
-- uma equipa e um projeto de Sistemas Distribuídos, reuniões, mensagens, turnos e pedidos.
-- Correr uma vez numa das bases de dados; a replicação copia para a outra.
-- Se a equipa "Sistemas Distribuídos" já existir, não faz nada.

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS dados_apresentacao;

DELIMITER $$
CREATE PROCEDURE dados_apresentacao()
proc: BEGIN
  IF EXISTS (SELECT 1 FROM equipas WHERE nome = 'Sistemas Distribuídos') THEN
    SELECT 'Os dados da apresentação já existem: nada a fazer.' AS resultado;
    LEAVE proc;
  END IF;

  START TRANSACTION;

  -- Palavra-passe "elotask123" (bcrypt), igual à dos outros utilizadores de exemplo
  SET @hash = '$2b$10$uI7sdOSTE6vAh11J.UOJuOcnoRni8XnDaRGwAqZG9wconHdIT9J5q';
  SET @ana = 2, @joao = 3, @maria = 4, @pedro = 5;

  -- Prazos dos projetos existentes em datas atuais
  UPDATE tarefas SET estado = 'concluida', data_conclusao = '2026-11-06 17:30:00', prazo = '2026-11-06' WHERE id_tarefa = 1;
  UPDATE tarefas SET prazo = '2026-11-20' WHERE id_tarefa = 2;
  UPDATE tarefas SET estado = 'em_curso', data_inicio = '2026-11-09', prazo = '2026-11-18' WHERE id_tarefa = 3;
  UPDATE tarefas SET data_inicio = '2026-11-10', prazo = '2026-11-14' WHERE id_tarefa = 4;
  UPDATE tarefas SET prazo = '2026-11-21' WHERE id_tarefa = 5;

  -- Novos membros
  INSERT INTO utilizadores (nome, email, password_hash, tipo_utilizador, telefone, cargo, estado, data_criacao)
  VALUES ('Rita Lopes', 'rita.lopes@elotask.pt', @hash, 'colaborador', '910000006', 'Programadora', 'ativo', '2026-10-20 09:00:00');
  SET @rita = LAST_INSERT_ID();
  INSERT INTO utilizadores (nome, email, password_hash, tipo_utilizador, telefone, cargo, estado, data_criacao)
  VALUES ('Tiago Mendes', 'tiago.mendes@elotask.pt', @hash, 'colaborador', '910000007', 'Analista', 'ativo', '2026-10-20 09:05:00');
  SET @tiago = LAST_INSERT_ID();

  -- Equipa e projeto (a Ana cria os dois, por isso é a gestora)
  INSERT INTO equipas (nome, descricao, id_criador, data_criacao)
  VALUES ('Sistemas Distribuídos', 'Equipa do trabalho prático de Sistemas Distribuídos.', @ana, '2026-10-20 10:00:00');
  SET @equipa = LAST_INSERT_ID();
  INSERT INTO membros_equipa (id_equipa, id_utilizador, funcao, data_entrada) VALUES
    (@equipa, @ana, 'Coordenadora', '2026-10-20 10:00:00'),
    (@equipa, @joao, 'Programador', '2026-10-20 10:05:00'),
    (@equipa, @rita, 'Programadora', '2026-10-20 10:06:00'),
    (@equipa, @tiago, 'Analista', '2026-10-20 10:07:00');

  INSERT INTO projetos (nome, descricao, id_criador, data_inicio, data_fim, estado, data_criacao)
  VALUES ('Trabalho de Sistemas Distribuídos', 'Protótipo distribuído e tolerante a faltas: réplicas, balanceadores e replicação da base de dados.', @ana, '2026-10-20', '2026-12-18', 'em_curso', '2026-10-20 10:30:00');
  SET @projeto = LAST_INSERT_ID();
  INSERT INTO projeto_membros (id_projeto, id_utilizador, funcao, data_adicao) VALUES
    (@projeto, @ana, 'Gestora', '2026-10-20 10:30:00'),
    (@projeto, @joao, 'Programador', '2026-10-20 10:31:00'),
    (@projeto, @rita, 'Programadora', '2026-10-20 10:32:00'),
    (@projeto, @tiago, 'Analista', '2026-10-20 10:33:00'),
    (@projeto, @maria, 'Designer UI/UX', '2026-10-20 10:34:00');

  -- Tarefas do projeto
  INSERT INTO tarefas (id_projeto, id_criador, titulo, descricao, prioridade, estado, data_criacao, data_inicio, prazo, data_conclusao)
  VALUES (@projeto, @ana, 'Configurar o Docker e os balanceadores', 'Uma cópia de cada camada no PC e outra no Docker, com um balanceador à frente do frontend e outro à frente do backend.', 'alta', 'concluida', '2026-10-21 09:00:00', '2026-10-21', '2026-11-06', '2026-11-05 18:20:00');
  SET @t1 = LAST_INSERT_ID();
  INSERT INTO tarefas (id_projeto, id_criador, titulo, descricao, prioridade, estado, data_criacao, data_inicio, prazo, data_conclusao)
  VALUES (@projeto, @ana, 'Replicação da base de dados (GTID)', 'MySQL do PC e do Docker a copiarem-se nos dois sentidos, com IDs ímpares numa cópia e pares na outra.', 'urgente', 'concluida', '2026-10-28 09:00:00', '2026-11-03', '2026-11-12', '2026-11-12 17:50:00');
  SET @t2 = LAST_INSERT_ID();
  INSERT INTO tarefas (id_projeto, id_criador, titulo, descricao, prioridade, estado, data_criacao, data_inicio, prazo, data_conclusao)
  VALUES (@projeto, @ana, 'Medir a recuperação após falha', 'Desligar um backend com pedidos a correr e medir pedidos falhados e tempo de recuperação.', 'alta', 'concluida', '2026-11-05 09:00:00', '2026-11-10', '2026-11-12', '2026-11-12 18:04:00');
  SET @t3 = LAST_INSERT_ID();
  INSERT INTO tarefas (id_projeto, id_criador, titulo, descricao, prioridade, estado, data_criacao, data_inicio, prazo)
  VALUES (@projeto, @ana, 'Preparar a apresentação da 2.ª entrega', 'Slides, guião, demonstração e plano B.', 'urgente', 'em_curso', '2026-11-06 09:00:00', '2026-11-06', '2026-11-13');
  SET @t4 = LAST_INSERT_ID();
  INSERT INTO tarefas (id_projeto, id_criador, titulo, descricao, prioridade, estado, data_criacao, data_inicio, prazo)
  VALUES (@projeto, @ana, 'Entregar relatório e slides no Canvas', 'Relatório e slides em PDF, até às 23h59.', 'urgente', 'pendente', '2026-11-06 09:10:00', '2026-11-13', '2026-11-15');
  SET @t5 = LAST_INSERT_ID();
  INSERT INTO tarefas (id_projeto, id_criador, titulo, descricao, prioridade, estado, data_criacao, data_inicio, prazo)
  VALUES (@projeto, @ana, 'Adaptador Redis para o Socket.IO', 'Partilhar as mensagens em tempo real e o limite de pedidos de IA entre as duas réplicas.', 'alta', 'pendente', '2026-11-10 10:00:00', '2026-11-17', '2026-12-04');
  SET @t6 = LAST_INSERT_ID();
  INSERT INTO tarefas (id_projeto, id_criador, titulo, descricao, prioridade, estado, data_criacao, data_inicio, prazo)
  VALUES (@projeto, @ana, 'Ativar HTTPS/TLS nos balanceadores', 'Certificados nos dois balanceadores e redirecionamento de HTTP para HTTPS.', 'media', 'pendente', '2026-11-10 10:10:00', '2026-11-24', '2026-12-11');
  SET @t7 = LAST_INSERT_ID();
  INSERT INTO tarefas (id_projeto, id_criador, titulo, descricao, prioridade, estado, data_criacao, data_inicio, prazo)
  VALUES (@projeto, @ana, 'Rever o ecrã de turnos para estudantes', 'Adaptar os turnos a horários de aulas e trabalhos de grupo.', 'media', 'pendente', '2026-11-12 11:00:00', '2026-11-30', '2026-12-15');
  SET @t8 = LAST_INSERT_ID();

  INSERT INTO tarefa_responsaveis (id_tarefa, id_utilizador, data_atribuicao) VALUES
    (@t1, @joao, '2026-10-21 09:05:00'), (@t1, @tiago, '2026-10-21 09:06:00'),
    (@t2, @joao, '2026-10-28 09:05:00'),
    (@t3, @tiago, '2026-11-05 09:05:00'),
    (@t4, @ana, '2026-11-06 09:05:00'), (@t4, @rita, '2026-11-06 09:06:00'),
    (@t5, @ana, '2026-11-06 09:15:00'),
    (@t6, @joao, '2026-11-10 10:05:00'), (@t6, @rita, '2026-11-10 10:06:00'),
    (@t7, @tiago, '2026-11-10 10:15:00'),
    (@t8, @maria, '2026-11-12 11:05:00'), (@t8, @rita, '2026-11-12 11:06:00');

  INSERT INTO checklists (id_tarefa, titulo, data_criacao) VALUES (@t4, 'Antes de apresentar', '2026-11-06 09:20:00');
  SET @lista = LAST_INSERT_ID();
  INSERT INTO itens_checklist (id_checklist, descricao, estado, ordem, data_conclusao) VALUES
    (@lista, 'Preencher os slides', 'feito', 1, '2026-11-12 23:40:00'),
    (@lista, 'Print da simulação de falha', 'feito', 2, '2026-11-13 02:12:00'),
    (@lista, 'Atualizar o guião', 'feito', 3, '2026-11-13 02:50:00'),
    (@lista, 'Ensaiar com cronómetro', 'a_fazer', 4, NULL),
    (@lista, 'Exportar os slides para PDF', 'por_fazer', 5, NULL);

  -- Reuniões
  INSERT INTO reunioes (titulo, descricao, id_criador, data_inicio, data_fim, tipo_reuniao, localizacao, link_reuniao, estado, data_criacao)
  VALUES ('Ponto de situação da replicação', 'Decidir como replicar a base de dados e como medir a recuperação.', @joao, '2026-11-10 16:00:00', '2026-11-10 16:40:00', 'online', NULL, 'https://exemplo.invalid/replicacao', 'concluida', '2026-11-08 12:00:00');
  SET @r1 = LAST_INSERT_ID();
  INSERT INTO reunioes (titulo, descricao, id_criador, data_inicio, data_fim, tipo_reuniao, localizacao, link_reuniao, estado, data_criacao)
  VALUES ('Ensaio da apresentação', 'Ensaio geral com cronómetro e teste da demonstração.', @rita, '2026-11-13 09:00:00', '2026-11-13 09:30:00', 'presencial', 'Sala 2.04', NULL, 'agendada', '2026-11-11 20:00:00');
  SET @r2 = LAST_INSERT_ID();
  INSERT INTO reunioes (titulo, descricao, id_criador, data_inicio, data_fim, tipo_reuniao, localizacao, link_reuniao, estado, data_criacao)
  VALUES ('Revisão pós-apresentação', 'O que correu bem, o que os professores perguntaram e o que mudar.', @ana, '2026-11-17 14:00:00', '2026-11-17 14:45:00', 'online', NULL, 'https://exemplo.invalid/revisao', 'agendada', '2026-11-12 10:00:00');
  SET @r3 = LAST_INSERT_ID();
  INSERT INTO reunioes (titulo, descricao, id_criador, data_inicio, data_fim, tipo_reuniao, localizacao, link_reuniao, estado, data_criacao)
  VALUES ('Planeamento da 3.ª entrega', 'Dividir o trabalho até 18/12: Redis, HTTPS e foco nos estudantes.', @ana, '2026-11-20 10:00:00', '2026-11-20 11:00:00', 'online', NULL, 'https://exemplo.invalid/planeamento', 'agendada', '2026-11-12 10:05:00');
  SET @r4 = LAST_INSERT_ID();

  INSERT INTO reuniao_participantes (id_reuniao, id_utilizador, estado_convite, data_resposta) VALUES
    (@r1, @ana, 'aceite', '2026-11-08 12:30:00'), (@r1, @joao, 'aceite', '2026-11-08 12:00:00'), (@r1, @tiago, 'aceite', '2026-11-08 13:00:00'),
    (@r2, @ana, 'aceite', '2026-11-11 20:10:00'), (@r2, @joao, 'aceite', '2026-11-11 20:15:00'), (@r2, @rita, 'aceite', '2026-11-11 20:00:00'), (@r2, @tiago, 'pendente', NULL),
    (@r3, @ana, 'aceite', '2026-11-12 10:00:00'), (@r3, @joao, 'pendente', NULL), (@r3, @rita, 'aceite', '2026-11-12 10:20:00'), (@r3, @tiago, 'pendente', NULL),
    (@r4, @ana, 'aceite', '2026-11-12 10:05:00'), (@r4, @joao, 'pendente', NULL), (@r4, @rita, 'pendente', NULL), (@r4, @tiago, 'pendente', NULL), (@r4, @maria, 'pendente', NULL);

  INSERT INTO resumos_reunioes (id_reuniao, conteudo_resumo, modelo_ia, data_geracao)
  VALUES (@r1, 'A equipa decidiu replicar a base de dados nos dois sentidos com GTID, com IDs ímpares no PC e pares no Docker para evitar conflitos. O balanceador do backend passa a usar a base de dados do PC se a do Docker falhar. Para a apresentação, o Tiago mede a recuperação com 120 pedidos a correr. O Redis para o tempo real fica para a 3.ª entrega.', 'resumo-ia', '2026-11-10 16:45:00');
  INSERT INTO decisoes_reuniao (id_reuniao, descricao, id_responsavel, data_decisao, estado_validacao, data_criacao) VALUES
    (@r1, 'Replicar a base de dados nos dois sentidos com GTID.', @joao, '2026-11-10 16:20:00', 'confirmada', '2026-11-10 16:45:00'),
    (@r1, 'Medir a recuperação com 120 pedidos durante a falha.', @tiago, '2026-11-10 16:30:00', 'confirmada', '2026-11-10 16:45:00'),
    (@r1, 'Avaliar o Redis para as mensagens em tempo real.', @rita, '2026-11-10 16:35:00', 'pendente', '2026-11-10 16:45:00');

  -- Calendário
  INSERT INTO eventos_calendario (id_criador, titulo, descricao, data_inicio, data_fim, tipo_evento, data_criacao) VALUES
    (@ana, 'Apresentação da 2.ª entrega', '10 minutos: arquitetura, demonstração, IA e segurança.', '2026-11-13 10:00:00', '2026-11-13 11:00:00', 'prazo', '2026-11-06 09:00:00'),
    (@ana, 'Entrega no Canvas', 'Relatório e slides em PDF até às 23h59.', '2026-11-15 23:00:00', '2026-11-15 23:59:00', 'prazo', '2026-11-06 09:05:00'),
    (@ana, '3.ª entrega', 'Entrega final do projeto.', '2026-12-18 09:00:00', '2026-12-18 18:00:00', 'prazo', '2026-11-06 09:10:00');

  -- Conversas e mensagens
  INSERT INTO conversas (nome, tipo, id_criador, data_criacao, estado) VALUES ('Sistemas Distribuídos', 'grupo', @ana, '2026-10-20 10:40:00', 'ativa');
  SET @grupo = LAST_INSERT_ID();
  INSERT INTO membros_conversa (id_conversa, id_utilizador, data_entrada, papel) VALUES
    (@grupo, @ana, '2026-10-20 10:40:00', 'administrador'), (@grupo, @joao, '2026-10-20 10:40:00', 'membro'),
    (@grupo, @rita, '2026-10-20 10:40:00', 'membro'), (@grupo, @tiago, '2026-10-20 10:40:00', 'membro');
  INSERT INTO mensagens (id_conversa, id_remetente, conteudo, tipo_mensagem, data_envio) VALUES
    (@grupo, @joao, 'A replicação já funciona nos dois sentidos: as duas bases de dados têm os mesmos 199 registos.', 'texto', '2026-11-12 18:02:00'),
    (@grupo, @tiago, 'Medi a falha do backend: 0 de 120 pedidos falharam e o contentor voltou em 3,1 s.', 'texto', '2026-11-12 18:05:00'),
    (@grupo, @rita, 'Ótimo! Ponho esses valores no slide 6.', 'texto', '2026-11-12 18:10:00'),
    (@grupo, @ana, 'Bom dia! Ensaio às 9h na sala 2.04. Tragam o portátil com o Docker já a correr.', 'texto', '2026-11-13 08:30:00'),
    (@grupo, @joao, 'Combinado, já arranquei tudo.', 'texto', '2026-11-13 08:34:00');

  INSERT INTO conversas (nome, tipo, id_criador, data_criacao, estado) VALUES (NULL, 'individual', @rita, '2026-11-12 21:00:00', 'ativa');
  SET @privada = LAST_INSERT_ID();
  INSERT INTO membros_conversa (id_conversa, id_utilizador, data_entrada, papel) VALUES
    (@privada, @rita, '2026-11-12 21:00:00', 'membro'), (@privada, @ana, '2026-11-12 21:00:00', 'membro');
  INSERT INTO mensagens (id_conversa, id_remetente, conteudo, tipo_mensagem, data_envio) VALUES
    (@privada, @rita, 'Ana, consegues rever o guião antes do ensaio?', 'texto', '2026-11-12 21:00:00'),
    (@privada, @ana, 'Sim, já deixei comentários. Falta só ensaiar com cronómetro.', 'texto', '2026-11-12 21:12:00');

  INSERT INTO mensagens (id_conversa, id_remetente, conteudo, tipo_mensagem, data_envio)
  VALUES (2, @ana, 'Lembrete: atualizem o estado das tarefas antes da apresentação de hoje.', 'texto', '2026-11-13 08:00:00');

  INSERT INTO canais (id_equipa, nome, descricao, tipo, id_criador, data_criacao)
  VALUES (@equipa, 'geral', 'Avisos da equipa de Sistemas Distribuídos.', 'publico', @ana, '2026-10-20 10:45:00');
  SET @canal = LAST_INSERT_ID();
  INSERT INTO membros_canal (id_canal, id_utilizador, data_entrada, papel) VALUES
    (@canal, @ana, '2026-10-20 10:45:00', 'administrador'), (@canal, @joao, '2026-10-20 10:46:00', 'membro'),
    (@canal, @rita, '2026-10-20 10:46:00', 'membro'), (@canal, @tiago, '2026-10-20 10:46:00', 'membro');
  INSERT INTO mensagens (id_canal, id_remetente, conteudo, tipo_mensagem, data_envio) VALUES
    (@canal, @ana, 'A apresentação é hoje às 10h. Boa sorte a todos!', 'texto', '2026-11-13 08:45:00'),
    (@canal, @tiago, 'Os prints do plano B estão no slide 6.', 'texto', '2026-11-13 08:50:00');

  -- Turnos: 13 e 16/11 já com pessoas; 17 a 20/11 vazios, para gerar a escala com a IA
  INSERT INTO turnos (nome, hora_inicio, hora_fim, data_turno, descricao, numero_colaboradores) VALUES
    ('Turno da manhã', '09:00:00', '13:00:00', '2026-11-13', 'Apoio ao laboratório.', 2);
  SET @tm13 = LAST_INSERT_ID();
  INSERT INTO turnos (nome, hora_inicio, hora_fim, data_turno, descricao, numero_colaboradores) VALUES
    ('Turno da tarde', '14:00:00', '18:00:00', '2026-11-13', 'Apoio ao laboratório.', 2);
  SET @tt13 = LAST_INSERT_ID();
  INSERT INTO turnos (nome, hora_inicio, hora_fim, data_turno, descricao, numero_colaboradores) VALUES
    ('Turno da manhã', '09:00:00', '13:00:00', '2026-11-16', 'Apoio ao laboratório.', 2);
  SET @tm16 = LAST_INSERT_ID();
  INSERT INTO turnos (nome, hora_inicio, hora_fim, data_turno, descricao, numero_colaboradores) VALUES
    ('Turno da tarde', '14:00:00', '18:00:00', '2026-11-16', 'Apoio ao laboratório.', 2);
  SET @tt16 = LAST_INSERT_ID();
  INSERT INTO turnos (nome, hora_inicio, hora_fim, data_turno, descricao, numero_colaboradores) VALUES
    ('Turno da manhã', '09:00:00', '13:00:00', '2026-11-17', 'Apoio ao laboratório.', 2),
    ('Turno da tarde', '14:00:00', '18:00:00', '2026-11-17', 'Apoio ao laboratório.', 2),
    ('Turno da manhã', '09:00:00', '13:00:00', '2026-11-18', 'Apoio ao laboratório.', 2),
    ('Turno da tarde', '14:00:00', '18:00:00', '2026-11-18', 'Apoio ao laboratório.', 2),
    ('Turno da manhã', '09:00:00', '13:00:00', '2026-11-19', 'Apoio ao laboratório.', 2),
    ('Turno da tarde', '14:00:00', '18:00:00', '2026-11-19', 'Apoio ao laboratório.', 2),
    ('Turno da manhã', '09:00:00', '13:00:00', '2026-11-20', 'Apoio ao laboratório.', 2),
    ('Turno da tarde', '14:00:00', '18:00:00', '2026-11-20', 'Apoio ao laboratório.', 2);

  INSERT INTO turno_colaboradores (id_turno, id_utilizador, estado, data_atribuicao) VALUES
    (@tm13, @joao, 'confirmado', '2026-11-10 09:00:00'), (@tm13, @pedro, 'confirmado', '2026-11-10 09:00:00'),
    (@tt13, @maria, 'atribuido', '2026-11-10 09:00:00'), (@tt13, @rita, 'atribuido', '2026-11-10 09:00:00'),
    (@tm16, @joao, 'atribuido', '2026-11-12 09:00:00'), (@tm16, @tiago, 'atribuido', '2026-11-12 09:00:00'),
    (@tt16, @pedro, 'atribuido', '2026-11-12 09:00:00'), (@tt16, @maria, 'atribuido', '2026-11-12 09:00:00');

  -- Disponibilidade semanal (usada pela IA ao gerar a escala); a Ana é gestora e não faz turnos
  INSERT INTO disponibilidades_colaborador (id_utilizador, dia_semana, hora_inicio, hora_fim) VALUES
    (@joao, 'segunda', '08:00', '14:00'), (@joao, 'terca', '08:00', '14:00'), (@joao, 'quarta', '08:00', '14:00'), (@joao, 'quinta', '08:00', '14:00'), (@joao, 'sexta', '08:00', '14:00'),
    (@maria, 'segunda', '13:00', '19:00'), (@maria, 'terca', '13:00', '19:00'), (@maria, 'quarta', '13:00', '19:00'), (@maria, 'quinta', '13:00', '19:00'), (@maria, 'sexta', '13:00', '19:00'),
    (@pedro, 'segunda', '08:00', '19:00'), (@pedro, 'quarta', '08:00', '19:00'), (@pedro, 'sexta', '08:00', '19:00'),
    (@rita, 'segunda', '13:00', '19:00'), (@rita, 'terca', '08:00', '19:00'), (@rita, 'quinta', '08:00', '19:00'),
    (@tiago, 'segunda', '08:00', '19:00'), (@tiago, 'terca', '08:00', '19:00'), (@tiago, 'quarta', '08:00', '19:00'), (@tiago, 'quinta', '08:00', '19:00'), (@tiago, 'sexta', '08:00', '19:00');

  -- Ausências e troca de turno
  INSERT INTO pedidos_ausencia (id_utilizador, tipo_ausencia, data_inicio, data_fim, motivo, estado, data_pedido, id_aprovador, data_decisao) VALUES
    (@pedro, 'folga', '2026-11-20', '2026-11-20', 'Consulta médica.', 'aprovado', '2026-11-09 10:00:00', @ana, '2026-11-09 15:00:00'),
    (@tiago, 'folga', '2026-11-19', '2026-11-19', 'Exame de outra disciplina.', 'pendente', '2026-11-12 19:00:00', NULL, NULL),
    (@rita, 'ferias', '2026-12-21', '2026-12-31', 'Férias de Natal.', 'pendente', '2026-11-12 19:30:00', NULL, NULL);

  INSERT INTO pedidos_troca_turno (id_solicitante, id_destinatario, id_turno_solicitante, id_turno_destinatario, motivo, estado, data_pedido)
  VALUES (@joao, @pedro, @tm16, @tt16, 'Tenho uma aula na segunda de manhã.', 'pendente', '2026-11-12 20:00:00');

  -- Notificações
  INSERT INTO notificacoes (id_utilizador, tipo, titulo, mensagem, entidade_tipo, entidade_id, lida, data_criacao) VALUES
    (@ana, 'prazo', 'Prazo hoje', 'A tarefa Preparar a apresentação da 2.ª entrega termina hoje.', 'tarefa', @t4, 0, '2026-11-13 08:00:00'),
    (@ana, 'reuniao', 'Convite para reunião', 'A Rita Lopes convidou-a para Ensaio da apresentação.', 'reuniao', @r2, 0, '2026-11-11 20:00:00'),
    (@ana, 'tarefa_atribuida', 'Tarefa atribuída', 'Foi-lhe atribuída a tarefa Entregar relatório e slides no Canvas.', 'tarefa', @t5, 0, '2026-11-06 09:15:00'),
    (@ana, 'ausencia', 'Pedido de ausência', 'O Tiago Mendes pediu folga para 19/11.', 'pedido_ausencia', NULL, 0, '2026-11-12 19:00:00'),
    (@ana, 'mensagem', 'Nova mensagem', 'Rita Lopes: Ana, consegues rever o guião antes do ensaio?', 'conversa', @privada, 1, '2026-11-12 21:00:00'),
    (@joao, 'tarefa_atribuida', 'Tarefa atribuída', 'Foi-lhe atribuída a tarefa Adaptador Redis para o Socket.IO.', 'tarefa', @t6, 0, '2026-11-10 10:05:00'),
    (@joao, 'reuniao', 'Convite para reunião', 'A Ana Silva convidou-o para Revisão pós-apresentação.', 'reuniao', @r3, 0, '2026-11-12 10:00:00'),
    (@rita, 'tarefa_atribuida', 'Tarefa atribuída', 'Foi-lhe atribuída a tarefa Rever o ecrã de turnos para estudantes.', 'tarefa', @t8, 0, '2026-11-12 11:06:00'),
    (@tiago, 'reuniao', 'Convite para reunião', 'A Rita Lopes convidou-o para Ensaio da apresentação.', 'reuniao', @r2, 0, '2026-11-11 20:00:00');

  -- Lembretes de prazos
  INSERT INTO lembretes_prazos (id_tarefa, id_utilizador, tipo_lembrete, data_lembrete, mensagem, estado, data_envio, data_criacao) VALUES
    (@t4, @ana, 'prazo_hoje', '2026-11-13 08:00:00', 'A tarefa Preparar a apresentação da 2.ª entrega tem o prazo para hoje.', 'enviado', '2026-11-13 08:00:00', '2026-11-06 09:00:00'),
    (@t5, @ana, 'prazo_proximo', '2026-11-14 09:00:00', 'A entrega no Canvas é no domingo, até às 23h59.', 'pendente', NULL, '2026-11-06 09:15:00'),
    (@t6, @joao, 'prazo_proximo', '2026-12-01 09:00:00', 'O adaptador Redis tem o prazo a 04/12.', 'pendente', NULL, '2026-11-10 10:05:00');

  -- Sugestões da IA para o projeto
  INSERT INTO sugestoes_ia (id_projeto, id_utilizador, tipo_sugestao, descricao, justificacao, estado, data_geracao) VALUES
    (@projeto, @ana, 'prioridade', 'Começar o adaptador Redis logo a seguir à apresentação.', 'É o ponto em aberto que afeta mais funcionalidades: tempo real e limite de pedidos de IA.', 'pendente', '2026-11-12 12:00:00'),
    (@projeto, @ana, 'organizacao', 'Juntar o HTTPS e o Redis na mesma semana de testes.', 'Os dois mexem nos balanceadores e podem ser testados em conjunto.', 'pendente', '2026-11-12 12:00:00');
  INSERT INTO sugestoes_organizacao (id_tarefa, prioridade_atual, prioridade_sugerida, prazo_atual, prazo_sugerido, justificacao, estado, data_geracao)
  VALUES (@t6, 'alta', 'urgente', '2026-12-04', '2026-11-28', 'Deixa uma semana de margem para testes de falha antes da 3.ª entrega.', 'pendente', '2026-11-12 12:00:00');

  -- Histórico
  INSERT INTO historico_alteracoes (id_utilizador, id_projeto, id_tarefa, tipo_alteracao, descricao, data_alteracao) VALUES
    (@ana, @projeto, NULL, 'criacao_projeto', 'Criou o projeto Trabalho de Sistemas Distribuídos.', '2026-10-20 10:30:00'),
    (@joao, @projeto, @t1, 'conclusao_tarefa', 'Concluiu a tarefa Configurar o Docker e os balanceadores.', '2026-11-05 18:20:00'),
    (@joao, @projeto, @t2, 'conclusao_tarefa', 'Concluiu a tarefa Replicação da base de dados (GTID).', '2026-11-12 17:50:00'),
    (@tiago, @projeto, @t3, 'conclusao_tarefa', 'Concluiu a tarefa Medir a recuperação após falha.', '2026-11-12 18:04:00'),
    (@ana, @projeto, @t4, 'atualizacao_estado', 'Alterou o estado da tarefa Preparar a apresentação para em_curso.', '2026-11-12 23:40:00'),
    (@ana, 1, 1, 'conclusao_tarefa', 'Concluiu a tarefa Implementar autenticação.', '2026-11-06 17:30:00');

  COMMIT;
  SELECT 'Dados da apresentação criados.' AS resultado;
END$$
DELIMITER ;

CALL dados_apresentacao();
DROP PROCEDURE dados_apresentacao;
