# ETAPA 18 — Download de galeria

## Endpoint
`GET /api/gallery-download`

## Parametros
Parametro obrigatorio:
- `slug`

Exemplo:
- `/api/gallery-download?slug=nude-armchair`

## Estrutura de retorno
O endpoint retorna a lista de arquivos consistentes da galeria, apontando para as imagens `large`.

Formato:

```json
{
  "slug": "nude-armchair",
  "total": 2,
  "files": [
    {
      "fileName": "imagem-01.jpg",
      "url": "/data/imports/default/nude-armchair/images/large/imagem-01.jpg"
    }
  ]
}
```

## Limitacoes atuais
- nao ha geracao de ZIP dinamico
- o endpoint apenas lista URLs de download
- o front atual nao ganhou interface nova nesta etapa
