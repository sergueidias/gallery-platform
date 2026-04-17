# ETAPA 04 — Modelo de galeria e ingestao basica

## Objetivo
Criar uma representacao simples de galeria em JSON e preparar a ingestao basica de um export do Lightroom Classic a partir de uma estrutura de arquivos local.

## Como o sistema representa uma galeria
- cada galeria e um objeto em `app/data/galleries.json`
- o objeto define identificacao, metadados principais, capa, sinalizacao de privacidade e o caminho de origem em `sourcePath`
- `sourcePath` aponta para uma pasta local em `data/imports/` que concentra os arquivos do export a serem usados pelo sistema

## Como o LRc sera usado como fonte
- o Lightroom Classic continua sendo a origem do material exportado
- nesta etapa, o sistema espera apenas a estrutura `images/thumbnails/` e `images/large/`
- a ingestao basica cruza os nomes dos arquivos presentes nas duas pastas para descobrir itens consistentes

## O que ja funciona
- leitura do catalogo de galerias em JSON
- `GET /api/galleries` retorna a lista de galerias
- `GET /api/gallery/:slug` retorna os dados da galeria e os nomes de arquivos encontrados em comum entre `thumbnails` e `large`
- estrutura inicial criada em `data/imports/default/nude-armchair/`

## O que ainda nao esta implementado
- leitura de metadados `LR.images` do export HTML
- importacao automatica
- autenticao real
- controle de download
- publicacao ou integracao com infraestrutura
