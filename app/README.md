# App local

Esqueleto minimo de servidor Node.js para desenvolvimento local do `gallery-platform`.

## Como executar

```bash
APP_PORT=3000 node server.js
```

Ou:

```bash
npm start
```

## Rotas disponiveis

- `GET /` retorna a vitrine estatica inicial
- `GET /styles.css` retorna os estilos da vitrine
- `GET /assets/...` retorna placeholders locais usados nas capas
- `GET /api/galleries` retorna a lista de galerias do catalogo JSON
- `GET /api/gallery/:slug` retorna uma galeria com a listagem basica de imagens consistentes
- `GET /health` retorna JSON simples de status

## Escopo desta etapa

- sem dependencias externas
- sem framework web
- sem banco de dados
- sem publicacao
- sem integracao com infraestrutura
