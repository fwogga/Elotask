# EloTask

> **Conecta. Comunica. Colabora.**

O EloTask é uma plataforma de colaboração e gestão de projetos que reúne num único ambiente a comunicação da equipa, a gestão de tarefas, reuniões, documentos e turnos, para que as equipas deixem de depender de várias ferramentas dispersas.

O nome junta **"Elo"**, que simboliza a ligação entre os membros de uma equipa, e **"Task"** (tarefa), que representa a organização e o acompanhamento do trabalho.

Projeto académico da UC **Projeto de Desenvolvimento de Software** (Licenciatura em Engenharia Informática, LEIF01, 2026-27), Faculdade de Design, Tecnologia e Comunicação, Universidade Europeia. Docente: Rui Pascoal.

## Funcionalidades

- **Utilizadores, equipas e projetos**: registo, autenticação, perfis e permissões por perfil
- **Tarefas**: criar, atribuir, atualizar e acompanhar (descrição, estado, responsável e data-limite)
- **Comunicação**: mensagens diretas e canais de equipa
- **Reuniões e calendário**: agendamento de reuniões e consulta de eventos e prazos de tarefas
- **Documentos**: partilha de ficheiros com controlo de acesso
- **Gestão de turnos (CSP)**: registo de disponibilidades, geração automática de escalas e validação de pedidos de troca
- **Auditoria**: registo de operações críticas, como alterações de permissões e trocas de turno

## Gestão de Turnos com CSP

A componente de Inteligência Artificial modela a escala de turnos como um **Problema de Satisfação de Restrições (CSP)**: as variáveis são as posições a preencher, os domínios são os colaboradores elegíveis e as restrições incluem disponibilidade, cobertura mínima, competências, limites de horas, períodos de descanso e ausências aprovadas. Se não existir uma solução válida, o sistema informa o utilizador e **não** guarda uma escala inválida.

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js (API REST) |
| Base de dados | MySQL |
| Segurança na comunicação | HTTPS/TLS |
| Ferramentas | GitHub, Docker (opcional), Figma, draw.io, MySQL Workbench, ClickUp |

## Arquitetura

```
Utilizador → Frontend → Backend (Node.js) → MySQL
                            └── Motor CSP
```

Evolução futura: Load Balancer com várias instâncias do backend e replicação da base de dados.

## Segurança

- Palavras-passe guardadas com hashing seguro, nunca em texto simples
- Autorização verificada no servidor em todas as operações
- Validação de dados e consultas SQL parametrizadas
- Segredos guardados na configuração do ambiente, não no repositório
- HTTPS/TLS em toda a comunicação cliente-servidor

## Equipa

| Nome | Número |
|---|---|
| Cássia Baptista | 20231704 |
| Marlinda Congo | 20241718 |
| Miguel Almeida | 20240206 |
| Deuwer Rabelais | 20241521 |

## Estado

📝 Fase 1: proposta de projeto. Requisitos, diagramas UML e arquitetura definidos; a implementação ainda não começou.
