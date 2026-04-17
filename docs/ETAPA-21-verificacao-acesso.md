# ETAPA 21 — Verificacao de acesso

## Endpoint
`GET /api/gallery-access`

Parametro obrigatorio:
- `slug`

Exemplo:
- `/api/gallery-access?slug=nude-armchair`

## Estados possiveis
O endpoint retorna:
- `public` para galerias publicas
- `authorized` para galerias privadas com acesso valido
- `unauthorized` para galerias privadas sem acesso valido

Formato:

```json
{
  "slug": "nude-armchair",
  "access": "public"
}
```

## Uso pratico
Esse endpoint permite verificar rapidamente o estado de acesso de uma galeria sem precisar tentar abrir a pagina final ou o endpoint de download.

Ele reutiliza a validacao atual baseada em cookie temporario para galerias privadas.
