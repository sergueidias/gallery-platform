# SISTEMA OPERACIONAL

## Objetivo do gallery-platform
O `gallery-platform` e um sistema de galerias fotograficas mobile-first. A proposta e operar multiplos dominios com o mesmo motor, usando catalogos separados por dominio, vitrines publicas e galerias que futuramente poderao ter acesso por senha.

## Diferenca entre vitrine, pagina de entrada da galeria e galeria
- vitrine: pagina de descoberta com capas de galerias e chamadas visuais
- pagina de entrada da galeria: pagina intermediaria de contexto da galeria, onde podem existir descricao, capa, informacoes de acesso e regras antes da visualizacao completa
- galeria: conjunto de imagens da sessao ou ensaio, com metadados, ordem e comportamento de navegacao

## Fluxo principal
O fluxo operacional atual e:

`Lightroom Classic -> data/imports/ -> catalogo JSON -> app`

Isso significa:
- o Lightroom Classic gera o material exportado de origem
- o material entra em `data/imports/`
- o catalogo em `app/data/galleries.json` declara quais galerias existem e onde esta a origem de cada uma
- o app le esse catalogo e entrega HTML, assets e API local

## Papel de `app/data/galleries.json`
`app/data/galleries.json` e o catalogo simples de galerias do sistema.

Cada item do arquivo representa uma galeria e define:
- `slug`: identificador estavel da galeria
- `title`: nome exibivel
- `description`: descricao curta
- `cover`: nome do arquivo usado como capa
- `isPrivate`: sinalizacao de privacidade
- `password`: campo reservado para estrutura futura
- `allowDownload`: politica futura de download
- `sourcePath`: caminho local da origem dos arquivos importados

## Papel de `data/imports/`
`data/imports/` guarda a materia-prima local vinda do Lightroom Classic ou preparada a partir dela.

Nesta fase, a expectativa minima e:
- `images/thumbnails/`
- `images/large/`

Essas pastas concentram as imagens que serao relacionadas pelo sistema. O import ainda e basico: ele observa nomes de arquivo consistentes entre thumbnail e imagem maior.

## Papel de `app/server.js`
`app/server.js` e o servidor Node.js minimo do projeto.

Hoje ele concentra:
- entrega da vitrine estatica local
- entrega de CSS e assets locais
- rota de saude em `/health`
- API basica em `/api/galleries`
- API basica em `/api/gallery/:slug`

Ele ainda nao faz:
- autenticacao real
- leitura completa de metadados do export do Lightroom
- integracao com banco
- publicacao

## Fluxo de trabalho LOCAL -> git push -> SERVIDOR -> git pull
O fluxo operacional esperado e:

1. LOCAL
- fazer mudancas pequenas e reversiveis no repositorio local
- revisar diff, comportamento esperado e documentacao

2. git push
- enviar apenas mudancas revisadas para o repositorio remoto

3. SERVIDOR
- acessar o checkout do projeto no servidor, sem alterar infraestrutura paralela

4. git pull
- atualizar o codigo no servidor a partir do repositorio remoto

Regra importante:
- infraestrutura, servicos, portas, Nginx, Docker e componentes externos nao fazem parte do fluxo normal de manutencao deste repositorio
