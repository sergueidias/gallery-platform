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

- `GET /` retorna texto simples confirmando que o app esta ativo
- `GET /health` retorna JSON simples de status

## Escopo desta etapa

- sem dependencias externas
- sem framework web
- sem banco de dados
- sem publicacao
- sem integracao com infraestrutura
