# Scripts de teste

Scripts para Windows usados nos ensaios da 2.ª entrega. Correm-se com duplo clique e funcionam a partir de qualquer pasta. Precisam do MAMP ligado, do Docker Desktop aberto e do ficheiro `Backend/.env`.

| Script | O que faz |
| --- | --- |
| `arrancar_tudo.bat` | Abre as 3 janelas do PC (`iniciar.bat`) e arranca os contentores (`docker compose up -d --build`). |
| `testar_falha.bat` | Desliga à força o servidor do Docker com 120 pedidos a correr, conta os que falham e mede o tempo até voltar a responder. |
| `repor_dados.bat` | Apaga a base de dados e volta a carregar `01_elotask.sql`, `02_palavras_passe.sql` e `03_dados_apresentacao.sql`. Corre na BD do Docker; a replicação copia para o MAMP. Antes, guarda uma cópia em `logs/`. |
| `verificar.bat` | Mostra o número de registos da BD do Docker e o estado da replicação. |

Os registos e as cópias ficam em `logs/`, que não vai para o GitHub. As contas de demonstração usam a palavra-passe `elotask123`.
