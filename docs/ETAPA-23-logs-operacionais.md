# ETAPA 23 — Logs operacionais

## Eventos registrados
O sistema passa a registrar logs minimos em `console.log` para observar uso real das rotas principais.

Eventos atuais:
- `gallery_view`
- `gallery_access_attempt`
- `gallery_download`
- `manifest_request`

## Formato
Os logs sao emitidos em JSON estruturado:

```json
{
  "type": "gallery_view",
  "timestamp": "2026-04-17T12:00:00.000Z",
  "data": {
    "slug": "nude-armchair"
  }
}
```

## Uso futuro
Esses logs podem apoiar:
- observacao basica de uso local
- validacao manual de fluxo
- integracoes futuras com automacao ou consolidacao operacional
