# ETAPA 03 — Esqueleto do app local

## Objetivo
Criar o esqueleto minimo do app web em Node.js para execucao local, sem publicacao, sem dependencias externas e sem integracao com infraestrutura.

## Arquivos criados
- `app/package.json`
- `app/server.js`
- `app/README.md`

## Comportamento esperado
- o servidor sobe localmente com porta configuravel por `APP_PORT` ou `PORT`
- `GET /` responde com texto simples confirmando que o app esta ativo
- `GET /health` responde com JSON simples de status
- rotas nao previstas retornam erro `404`
- metodos diferentes de `GET` retornam erro `405`

## Confirmacao de escopo
Nada foi publicado. Nenhuma dependencia foi instalada. Nenhuma integracao com Nginx, Docker, banco de dados, servidor ou outros componentes externos foi criada.
