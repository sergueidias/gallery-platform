# ETAPA 13 — Pipeline de ingestao LRcP

## Estrutura esperada do import
O import oficial continua seguindo a estrutura:

```text
data/imports/<catalog>/<slug>/images/
├── thumbnails/
└── large/
```

Essas duas pastas continuam sendo a base de leitura do sistema.

## Normalizacao de paths
Foi adicionada a funcao `normalizeImportPaths(gallery)`.

Ela e responsavel por:
- garantir caminhos consistentes para `thumbnails` e `large`
- evitar duplicacao de path
- normalizar separadores

Os campos derivados expostos pela API sao:
- `thumbnailsPathNormalized`
- `largePathNormalized`

## Impacto no fluxo
- a leitura do import continua igual
- a API agora devolve caminhos normalizados para consumo mais estavel
- o front passa a confiar nesses caminhos normalizados quando disponiveis
- nao houve alteracao de layout, multi-dominio, capa ou validacao estrutural
