# EloTask

<img width="585" height="165" alt="EloTask" src="https://github.com/user-attachments/assets/21b2b876-836d-489a-adc7-37e4187fb9ea" />

**Licenciatura em Engenharia Informática**  
LEIF01 | 26-27  
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

- [Introdução](#introdução)
- [Proposta do projeto](#proposta-do-projeto)
- [Público-alvo e âmbito atual](#público-alvo-e-âmbito-atual)
- [Objetivos](#objetivos)
- [Motivação e problema](#motivação-e-problema)
- [Solução proposta](#solução-proposta)
- [Tecnologias](#tecnologias)
- [Arquitetura distribuída](#arquitetura-distribuída)
- [Inteligência Artificial](#inteligência-artificial)
- [Segurança](#segurança)
- [Tolerância a falhas e testes](#tolerância-a-falhas-e-testes)
- [Estado e próximos passos](#estado-e-próximos-passos)
- [Links](#links)

---

## Introdução

O **EloTask** é uma plataforma digital de colaboração e gestão de projetos que procura reunir, num único ambiente, ferramentas de comunicação, organização e acompanhamento do trabalho em equipa.

A plataforma pretende facilitar a interação entre os membros de uma equipa, permitindo gerir projetos e tarefas, partilhar documentos, organizar reuniões e acompanhar o progresso das atividades.

O projeto surgiu da necessidade de reduzir a dispersão da informação por diferentes aplicações, que pode dificultar a organização, a comunicação e a coordenação do trabalho.

A segunda entrega documenta a evolução da proposta inicial para um protótipo funcional e distribuído, incluindo o trabalho de engenharia de requisitos, a arquitetura, a tolerância a falhas, a componente de Inteligência Artificial e as medidas de segurança.

## Proposta do projeto

O EloTask pretende centralizar num único espaço as ferramentas necessárias à colaboração e à gestão do trabalho. A solução integra funcionalidades de comunicação, gestão de equipas e projetos, tarefas, documentos, reuniões e calendário.

A proposta inicial considerava vários contextos de utilização, incluindo estudantes, equipas de desenvolvimento, pequenas e médias empresas, gestores de projeto, equipas remotas e associações.

No decorrer da engenharia de requisitos e da validação do MVP, identificámos que este âmbito era demasiado abrangente. Por esse motivo, a equipa decidiu concentrar o desenvolvimento futuro nos estudantes.

## Público-alvo e âmbito atual

**O público-alvo prioritário do EloTask são os estudantes**, em particular os que desenvolvem trabalhos académicos em grupo e precisam de organizar atividades e colaborar com os colegas.

A plataforma procura responder a necessidades como:

- Distribuir tarefas e responsabilidades pelos membros do grupo.
- Acompanhar o progresso dos trabalhos e os respetivos prazos.
- Partilhar documentos e informação relacionada com os projetos.
- Comunicar com os colegas e organizar reuniões.
- Centralizar a informação do projeto, reduzindo a necessidade de utilizar várias aplicações.

A gestão de turnos fez parte da proposta inicial e foi considerada na validação do protótipo. Contudo, a decisão atual é rever funcionalidades concebidas para contextos profissionais e adaptá-las ao âmbito académico.

## Objetivos

O objetivo geral do EloTask é desenvolver uma plataforma centralizada que facilite a colaboração e a gestão de projetos em equipa.

Entre os objetivos específicos encontram-se:

- Centralizar a comunicação e a informação dos projetos.
- Facilitar a criação e organização de equipas e projetos.
- Permitir a criação, atribuição e acompanhamento de tarefas.
- Apoiar a organização de reuniões e eventos.
- Disponibilizar uma arquitetura distribuída com tolerância a determinadas falhas.
- Integrar um serviço independente de Inteligência Artificial.

## Motivação e problema

Muitas equipas recorrem a diferentes aplicações para comunicar, realizar reuniões, gerir tarefas e partilhar documentos. Esta dispersão pode dificultar a organização da informação e obrigar os utilizadores a alternar entre várias plataformas.

Os principais problemas identificados são:

- Dispersão da informação por diferentes aplicações.
- Separação entre comunicação, documentos e tarefas.
- Dificuldade em acompanhar atividades pendentes e o progresso dos projetos.
- Falta de clareza nas responsabilidades e nos prazos.
- Possível perda de informação e decisões tomadas durante a colaboração.

A análise de plataformas existentes, o questionário e os testes do protótipo contribuíram para identificar e validar estas necessidades.

## Solução proposta

O EloTask procura responder a estes problemas através de uma plataforma que reúne funcionalidades de colaboração e gestão de projetos.

A solução contempla:

- Gestão de utilizadores e perfis.
- Criação e gestão de equipas e projetos.
- Gestão de tarefas, responsáveis e checklists.
- Comunicação através de mensagens e canais.
- Partilha de documentos e anexos.
- Organização de reuniões e eventos.
- Calendário e notificações.
- Integração de um serviço independente de Inteligência Artificial.

O protótipo foi desenvolvido com uma arquitetura distribuída, organizada em diferentes componentes e serviços.

## Tecnologias

| Camada / Componente | Tecnologia |
|---|---|
| Frontend | HTML, CSS e JavaScript |
| Backend | Node.js e Express.js |
| API | REST |
| Comunicação em tempo real | Socket.IO |
| Base de dados | MySQL com InnoDB |
| Balanceamento de carga | Nginx |
| Serviço de Inteligência Artificial | Python e FastAPI |
| Algoritmos CSP | Backtracking, Forward Checking, MRV e LCV |
| Autenticação | JWT |
| Hash de palavras-passe | bcrypt |
| Testes da API | Postman |
| Contentorização | Docker |
| Prototipagem | Figma |
| Gestão do projeto | ClickUp |
| Controlo de versões | GitHub |

## Arquitetura distribuída

O EloTask está organizado em várias camadas, com duas réplicas por camada, procurando reduzir o impacto da falha de uma instância.

```text
                    Utilizador
                        |
                 Balanceador 1
                     (Nginx)
                        |
              ---------------------
              |                   |
          Frontend 1          Frontend 2
              |                   |
              ----------- --------
                        |
                 Balanceador 2
                     (Nginx)
                        |
              ---------------------
              |                   |
          Backend 1           Backend 2
          (Node.js)           (Node.js)
              |                   |
              ----------- --------
                        |
              ---------------------
              |                   |
             DB1                 DB2
                  MySQL
                        |
             Serviço independente
                 Python / FastAPI
```

**Responsabilidades dos principais componentes:**

- **Frontend:** disponibiliza a interface e comunica com o backend.
- **Balanceadores Nginx:** distribuem os pedidos pelas instâncias disponíveis.
- **Backend:** gere a autenticação, as permissões, as regras de negócio e o acesso à base de dados.
- **Base de dados:** armazena os dados do sistema, recorrendo à replicação bidirecional MySQL.
- **Serviço Python:** executa a componente de Inteligência Artificial através de um serviço independente.

A arquitetura utiliza Docker para executar os diferentes componentes em ambiente contentorizado.

## Inteligência Artificial

O EloTask inclui um serviço independente de Inteligência Artificial desenvolvido em **Python com FastAPI**.

Uma das componentes utiliza o modelo de **Problemas de Satisfação de Restrições (CSP)** para apoiar a geração de escalas.

O problema é representado através de:

- **Variáveis:** vagas de turnos que precisam de ser preenchidas.
- **Domínios:** colaboradores elegíveis para cada vaga.
- **Restrições:** disponibilidade, ausências aprovadas e prevenção de sobreposição de horários e atribuições.

Para procurar soluções são utilizadas as seguintes técnicas:

| Técnica | Função |
|---|---|
| Backtracking | Atribui valores progressivamente e recua quando uma escolha impede completar a solução. |
| Forward Checking | Atualiza os domínios das variáveis futuras após cada atribuição. |
| MRV | Seleciona primeiro a variável com menos valores possíveis. |
| LCV | Experimenta primeiro o valor que elimina menos possibilidades futuras. |

O serviço Python também disponibiliza funcionalidades de geração de respostas em linguagem, resumos e sugestões, conforme a integração documentada na segunda entrega.

## Segurança

Foram implementadas várias medidas para proteger os dados e controlar o acesso às funcionalidades:

- **Autenticação JWT:** utilização de tokens para autenticar os pedidos.
- **Autorização por perfil:** controlo das operações permitidas a cada tipo de utilizador no servidor.
- **Hash de palavras-passe:** utilização de bcrypt para evitar o armazenamento de palavras-passe em texto simples.
- **Consultas parametrizadas:** redução do risco de SQL Injection.
- **Validação de dados:** validação dos dados recebidos antes do processamento.
- **Variáveis de ambiente:** proteção de credenciais e chaves fora do código-fonte.
- **Transações e bloqueios:** proteção da consistência das operações críticas.
- **Histórico e eliminação lógica:** apoio à rastreabilidade das alterações.

**Nota:** a comunicação HTTPS/TLS ainda não está ativa e permanece como trabalho a concluir.

## Tolerância a falhas e testes

A arquitetura foi concebida para tolerar a falha de uma réplica por camada, embora existam limitações.

Foram realizados testes de simulação de falha, nomeadamente através da interrupção de uma instância do backend.

| Medida | Resultado do ensaio |
|---|---|
| Pedidos falhados | 0 em 120 |
| Interrupção do serviço | Não houve |
| Tempo até o backend voltar a responder após ser religado | 3,1 segundos |

O ensaio demonstrou que o sistema conseguiu continuar a responder aos pedidos quando uma das réplicas do backend foi desligada.

Existem, contudo, limitações identificadas:

- Os balanceadores de carga continuam a ser pontos únicos de falha.
- A comunicação em tempo real entre réplicas Socket.IO necessita de um mecanismo partilhado.
- O limite de pedidos ao serviço de IA ainda necessita de um contador partilhado.
- O limite de ligações à base de dados por réplica precisa de confirmação.

## Estado e próximos passos

A segunda entrega permitiu desenvolver e testar um protótipo funcional e distribuído, documentar a componente CSP e implementar várias medidas de segurança.

Para a terceira entrega, estão previstos os seguintes trabalhos:

- Concentrar a experiência e as funcionalidades no público académico.
- Rever a navegação e o aspeto visual da interface.
- Adaptar funcionalidades inicialmente concebidas para a gestão de turnos ao novo âmbito do projeto.
- Continuar a validação com utilizadores.
- Resolver as limitações identificadas na arquitetura distribuída.
- Ativar HTTPS/TLS.
- Continuar os testes de integração e de tolerância a falhas.

A partilha de ecrã nas reuniões foi identificada durante os testes como uma funcionalidade valorizada por um participante. A sua implementação fica dependente da avaliação do backlog, do tempo e dos recursos disponíveis.

## Links

### Design e prototipagem

- **ClickUp:** https://app.clickup.com/90151677947/v/li/901526485764

### Desenvolvimento e documentação

- **GitHub:** [Repositório do projeto EloTask](INSERIR_LINK_DO_REPOSITORIO)

---

**Projeto desenvolvido no âmbito da unidade curricular de Projeto de Desenvolvimento de Software.**


