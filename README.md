# EloTask

<img width="585" height="165" alt="Screenshot 2026-10-13 115951" src="https://github.com/user-attachments/assets/21b2b876-836d-489a-adc7-37e4187fb9ea" />

**Licenciatura em Engenharia Informática**  
LEIF02 | 25-26  
**UC:** Projeto de Desenvolvimento de Software
**Docente:** Rui Pascoal 

**Grupo 9 – Turma D01**

## Equipa

| Nome | Número |
|---|---|
| Cássia Baptista | 20231704 |
| Marlinda Congo | 20241718 |
| Miguel Almeida | 20240206 |
| Deuwer Rabelais | 20241521 |

---

## Índice 
-Introdução 
-Proposta do projeto - EloTask
-Público alvo 
-Objetivo do EloTask
-Motivação 
-Problema 
-Solução Proposta - EloTask 
-Tecnologias
-Arquitetura
-Conclusão 
-Link

---
## Introdução

O projeto EloTask consiste no desenvolvimento de uma plataforma digital de colaboração e gestão de projetos que pretende integrar em um único ambiente **ferramentas de comunicação, organização e acompanhamento do trabalho em equipa.** A plataforma tem como finalidade facilitar a interação entre os membros de uma equipa permitindo comunicar, gerir tarefas e projetos, partilhar documentos, organizar reuniões e acompanhar o progresso das atividades.

Atualmente os trabalhos colaborativos dependem frequentemente da utilização de diferentes aplicações para realizar tarefas relacionadas com o mesmo projeto. Esta situação pode dificultar a organização da informação a coordenação entre os elementos de uma equipa e o acompanhamento das decisões tomadas.

## Proposta do projeto - Elotask

O EloTask destina-se a utilizadores que necessitam de colaborar com outras pessoas, organizar atividades e acompanhar o desenvolvimento de projetos. A plataforma pretende responder às necessidades de diferentes contextos académicos, profissionais e organizacionais.
Os principais **públicos-alvo** são:
•	Estudantes e grupos académicos: para distribuir tarefas, partilhar documentos, organizar reuniões e acompanhar prazos.
•	Equipas de desenvolvimento de software: para gerir tarefas, acompanhar funcionalidades e organizar as etapas de desenvolvimento.
•	Pequenas e médias empresas: para melhorar a comunicação interna e centralizar a informação.
•	Gestores de projetos e coordenadores de equipas: para planear atividades, distribuir responsabilidades e acompanhar o progresso.
•	Equipas remotas ou híbridas: para facilitar a comunicação e a partilha de informação entre pessoas que trabalham em locais diferentes.
•	Associações e outras organizações: para organizar atividades colaborativas e gerir responsabilidades.


## Objetivo do projeto

O desenvolvimento do EloTask pretende responder às dificuldades associadas à utilização de ferramentas dispersas para a comunicação e gestão do trabalho em equipa. Para esse efeito foram definidos um objetivo geral e um conjunto de objetivos específicos.


## Motivação

Muitas equipas utilizam diferentes aplicações para comunicar, realizar reuniões, gerir tarefas e partilhar documentos. Esta utilização pode dificultar a organização da informação e obrigar os utilizadores a alternar entre várias plataformas.

Na gestão de turnos, a necessidade de considerar simultaneamente disponibilidades, horários, competências e períodos de descanso pode tornar a elaboração de escalas uma tarefa complexa.

## Problema 

Os principais problemas considerados são:
•	Dispersão da informação por diferentes aplicações.
•	Separação entre comunicação e tarefas.
•	Dificuldade em acompanhar tarefas pendentes e o progresso dos projetos.
•	Falta de clareza nas responsabilidades e nos prazos.
•	Possível perda de decisões tomadas em reuniões.
•	Duplicação de informação e atualizações manuais.
•	Dificuldade em elaborar escalas de turnos que respeitem várias restrições em simultâneo.

## Solução Proposta 

O EloTask pretende centralizar a comunicação e a gestão do trabalho numa única plataforma, permitindo organizar utilizadores, equipas, projetos, tarefas, reuniões, documentos, calendários e turnos.

A solução prevê uma componente de Inteligência Artificial baseada em CSP, destinada a apoiar a geração de escalas e a validação de pedidos de troca de turno.

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js (API REST) |
| Base de dados | MySQL |
| Segurança na comunicação | HTTPS/TLS |
| Ferramentas | GitHub, Docker, Figma, draw.io, MySQL Workbench, ClickUp |

## Arquitetura

```
Utilizador → Frontend → Backend (Node.js) → MySQL
                            └── Motor CSP
```

Evolução futura: Load Balancer com várias instâncias do backend e replicação da base de dados.

----
### Links 

Na Fase 1 do projeto, foram utilizadas ferramentas digitais essências para o desenvolvimento, organização e gestão do trabalho da equipa.

### Design e Prototipagem 
- **ClickUp:**https://app.clickup.com/90151677947/v/li/901526485764


