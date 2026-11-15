# Memória Descritiva – EloTask

## Enquadramento

O EloTask é uma plataforma web de colaboração e gestão de projetos que junta, num único ambiente, equipas, projetos, tarefas, mensagens, reuniões, calendário e turnos. Nasce de um problema identificado no trabalho em grupo: a informação de cada projeto anda espalhada por várias aplicações e perde-se pelo caminho. O projeto foi desenvolvido no âmbito de Projeto de Desenvolvimento de Software, integrando Engenharia de Software, Sistemas Distribuídos, Segurança Informática e Inteligência Artificial.

## Levantamento e conceção

Na primeira fase analisámos ferramentas existentes (Teams, Slack, Trello e Jira), realizámos um questionário no Google Forms e uma entrevista moderada com o protótipo em Figma. O trabalho foi organizado no ClickUp e no GitHub, com a base de dados modelada no MySQL Workbench e a arquitetura em draw.io.

## Solução desenvolvida

O frontend é feito em HTML, CSS e JavaScript, sem framework. O backend é um servidor Node.js/Express que expõe uma API REST e usa Socket.IO para mensagens e chamadas em tempo real. Os dados ficam em MySQL. Um serviço independente em Python (FastAPI) concentra a Inteligência Artificial.

A componente de IA resolve Problemas de Satisfação de Restrições (CSP). Na geração de escalas, cada vaga de um turno é uma variável, os colaboradores disponíveis formam o domínio e as restrições são a disponibilidade semanal, as ausências aprovadas e a ausência de sobreposições. A pesquisa usa backtracking, forward checking e as heurísticas MRV e LCV. O mesmo motor sugere horários de reunião compatíveis com os participantes.

## Arquitetura distribuída

Na segunda fase o sistema passou a ter duas réplicas de cada camada: uma no computador e outra em contentores Docker. Um balanceador nginx reparte os pedidos entre os dois frontends e outro entre os dois backends. As duas bases de dados copiam-se nos dois sentidos com GTID, usando IDs ímpares numa e pares na outra para evitar conflitos. Nos testes, ao desligar um backend com 120 pedidos em curso, nenhum falhou e o servidor voltou a responder em 3,1 segundos. Os balanceadores continuam a ser pontos únicos de falha.

## Segurança

A autenticação usa tokens JWT e as palavras-passe são guardadas com bcrypt. As permissões são verificadas no servidor: o gestor é quem cria o projeto ou a equipa, e o administrador acede apenas às métricas do sistema. As consultas são parametrizadas e os segredos ficam em variáveis de ambiente. O HTTPS/TLS está previsto para a fase seguinte.

## Balanço e próximos passos

As entrevistas e o MVP mostraram que o âmbito inicial era demasiado largo. Até à terceira entrega o EloTask vai focar-se nos estudantes, rever o ecrã de turnos para esse público, concluir os documentos, a edição de perfil e os convites de equipa, e partilhar o tempo real entre réplicas com Redis.
