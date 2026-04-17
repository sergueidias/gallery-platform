# ETAPA 22 — Manifesto da galeria

## Endpoint
`GET /api/gallery-manifest`

Parametro obrigatorio:
- `slug`

Exemplo:
- `/api/gallery-manifest?slug=nude-armchair`

## Estrutura consolidada
O endpoint retorna um pacote consolidado com os dados principais da galeria:
- `gallery`: resumo derivado de `buildGallerySummary`
- `detail`: detalhe derivado de `buildGalleryDetail`
- `access`: estado de acesso atual
- `download`: informacoes para consumo do endpoint de download

Formato geral:

```json
{
  "gallery": {},
  "detail": {},
  "access": {
    "isPrivate": false,
    "status": "public"
  },
  "download": {
    "enabled": true,
    "totalFiles": 0,
    "endpoint": "/api/gallery-download?slug=nude-armchair"
  }
}
```

## Uso futuro
Esse manifesto serve como base consolidada para:
- front futuro com menos chamadas separadas
- integracoes com apps
- automacoes operacionais e verificacoes de consistencia
