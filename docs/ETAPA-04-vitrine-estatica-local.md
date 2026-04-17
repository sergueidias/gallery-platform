# ETAPA 04 — Vitrine estatica local

## Objetivo
Criar a primeira vitrine estatica do sistema, servida pelo app Node.js minimo ja existente, sem publicacao e sem integracao com infraestrutura.

## Arquivos criados e alterados
- `app/index.html`
- `app/styles.css`
- `app/assets/capa-serra.svg`
- `app/assets/capa-costa.svg`
- `app/assets/capa-estudio.svg`
- `app/server.js` atualizado para servir HTML, CSS e assets locais
- `app/README.md` atualizado com as rotas atuais
- `docs/ETAPA-04-vitrine-estatica-local.md`

## Comportamento esperado
- `GET /` retorna uma pagina HTML estatica de vitrine
- `GET /styles.css` retorna os estilos da pagina
- `GET /assets/...` retorna placeholders locais usados nas capas
- `GET /health` continua retornando JSON simples de status
- a interface foi pensada em abordagem mobile-first com tres capas ficticias clicaveis

## Confirmacao de escopo
Nada foi publicado. Nenhuma dependencia foi instalada. Nenhuma integracao com Nginx, Docker, portas externas ou servicos do servidor foi criada.
