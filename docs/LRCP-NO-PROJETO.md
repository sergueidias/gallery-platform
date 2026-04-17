# LRCP NO PROJETO

## O que LRcP significa no gallery-platform
No `gallery-platform`, LRcP e o formato de entrada fotografica vindo do Lightroom Classic que alimenta a ingestao de galerias.

Ele representa a origem oficial de conteudo do projeto nesta fase.

## LRcP como formato oficial atual de ingestao
LRcP e o formato oficial atual de ingestao do `gallery-platform`.

Na pratica, isso significa:
- o export do Lightroom Classic entra como materia-prima
- o sistema le a estrutura esperada do export
- o sistema abstrai esse conteudo para a sua propria navegacao e visualizacao

## Traducao para o sistema
O modelo esperado de traducao para dentro do projeto e:

```text
data/imports/<catalog>/<slug>/
├── images/
│   ├── thumbnails/
│   └── large/
└── source/
    └── index.html   (opcional)
```

Regra pratica:
- `data/imports/<catalog>/<slug>/images/thumbnails/`
- `data/imports/<catalog>/<slug>/images/large/`
- `source/index.html` e opcional para extracao futura

## Regra dos nomes fisicos
Os nomes fisicos dos arquivos nao devem ser renomeados.

Isso e importante porque:
- o exportFilename do LRcP depende desses nomes
- thumbnails e large precisam continuar relacionados pelo mesmo nome
- a ingestao futura depende de consistencia estrutural

## Abstracao por publicName
Embora os nomes fisicos nao devam ser renomeados, o sistema abstrai nomes sensiveis ou tecnicos via `publicName`.

O `publicName` e a forma publica e branded de apresentar a imagem no sistema.

## Regra de publicName
Formato:

`[codigo do estudio] [nome da galeria]-[numero de tombo]`

Codigos por dominio:
- `serguei.com.br = SXT`
- `tiemitamura.com = TT`
- `yukstudio.com = YUK`

Regra do numero de tombo:
- o numero de tombo e tudo que vem depois da data no nome do arquivo

Exemplo conceitual:
- nome fisico: `SXT_2025-10-27-173.jpg`
- leitura estrutural:
  - codigo do estudio: `SXT`
  - data: `2025-10-27`
  - numero de tombo: `173`

## Por que isso e importante
Essa regra e importante para:
- branding
- valor percebido
- consistencia entre dominios

Ela permite que o sistema preserve os nomes tecnicos do LRcP internamente, mas ofereca uma camada publica coerente com cada marca.
