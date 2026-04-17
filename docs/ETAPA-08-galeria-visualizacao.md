# ETAPA 08 — Galeria com visualizacao

## Objetivo
Implementar a galeria final com visualizacao real de imagens, usando thumbnails e imagens grandes vindas da estrutura local baseada no export do Lightroom Classic.

## Como a galeria funciona
- a rota `GET /gallery/:slug` carrega a galeria pelo `slug`
- o servidor busca arquivos consistentes entre:
  - `images/thumbnails/`
  - `images/large/`
- a pagina renderiza:
  - uma area principal com a imagem grande
  - um grid de thumbnails
- ao clicar em uma thumbnail, um JavaScript simples troca a imagem grande na mesma pagina

## Como os arquivos do LRc sao usados
- thumbnails sao servidas a partir de `data/imports/.../images/thumbnails/`
- imagens grandes sao servidas a partir de `data/imports/.../images/large/`
- os arquivos sao relacionados pelo mesmo nome de arquivo
- nesta etapa foi copiado um subconjunto real do export do Lightroom Classic para a galeria piloto local

## Limitacoes atuais
- ainda nao existe leitura completa de metadados do export HTML do Lightroom
- ainda nao existe senha real para galerias privadas
- ainda nao existe download
- a galeria ainda nao tem navegacao por teclado, setas ou overlay dedicado

## Proximos passos
- aplicar senha real quando `isPrivate` for verdadeiro
- adicionar politica de download com `allowDownload`
- enriquecer a galeria com metadados do export do Lightroom
- decidir se a visualizacao final fica na pagina ou em overlay dedicado
