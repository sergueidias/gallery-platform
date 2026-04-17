# ARQUITETURA LRCP

## Definicao de LRcP
LRcP significa `Lightroom Classic Pages`, ou seja, o export web gerado pelo Lightroom Classic para apresentacao de galerias.

No `gallery-platform`, LRcP e tratado como um formato de entrada estruturado para conteudo fotografico.

## Por que LRcP e relevante
LRcP e relevante porque entrega, de forma previsivel:
- thumbnails
- imagens em tamanho maior
- um `index.html` com estrutura e metadados
- uma convencao estavel de nome de arquivos

Isso permite que o `gallery-platform` use o export do Lightroom Classic como origem de conteudo sem depender do frontend gerado por ele.

## Arvore estrutural do export padrao

```text
LRcP/
├── index.html
├── assets/
│   ├── css/
│   └── js/
└── images/
    ├── thumbnails/
    └── large/
```

Estrutura esperada:
- `index.html`
- `assets/css/`
- `assets/js/`
- `images/thumbnails/`
- `images/large/`

## Partes uteis para o sistema
O que e estruturalmente util no LRcP:

- `images/thumbnails/`
  fonte das miniaturas da galeria

- `images/large/`
  fonte das imagens maiores da visualizacao final

- `LR.images` dentro do `index.html`
  estrutura de metadados embutida no export do Lightroom

- metadados por imagem
  especialmente:
  - `title`
  - `caption`
  - `exportFilename`

Esses elementos permitem que o sistema relacione arquivo fisico, nome exportado e metadados sem precisar reinterpretar o tema visual do export.

## Partes descartadas
O que nao deve ser tratado como parte do motor do sistema:

- frontend do LRc
- CSS do tema exportado
- JS do tema exportado
- `.DS_Store`

Esses itens pertencem ao pacote de apresentacao do Lightroom Classic, nao a arquitetura do `gallery-platform`.

## Regra central
O `gallery-platform` usa LRcP como fonte de conteudo, nao como frontend.

Isso significa:
- o sistema interpreta o export
- o sistema reutiliza thumbnails, imagens grandes e metadados
- o sistema nao reaproveita a interface pronta do LRcP como camada final de produto
