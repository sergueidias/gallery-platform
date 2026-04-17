# ETAPA 11 — Validacao do import LRcP

## Objetivo
Adicionar validacao estrutural minima no import LRcP para detectar inconsistencias entre pastas e arquivos sem bloquear o acesso a galeria.

## O que a validacao verifica
- existencia de thumbnails
- existencia de large
- presenca de imagens
- coerencia entre os nomes dos arquivos

## Status estruturais
O sistema passa a usar `galleryStatus` com estes valores:
- `ok`
- `error_no_thumbnails`
- `error_no_large`
- `error_no_images`
- `error_mismatch_files`

## Regra pratica
- se nao houver thumbnails: `error_no_thumbnails`
- se nao houver large: `error_no_large`
- se nao houver nenhum arquivo de imagem nas duas estruturas: `error_no_images`
- se houver arquivos mas os nomes nao baterem entre `thumbnails/` e `large/`: `error_mismatch_files`
- se tudo estiver consistente: `ok`

## Integracao com o sistema
- `GET /api/galleries` passa a devolver `galleryStatus`
- a vitrine mostra um indicativo discreto quando o import da galeria nao estiver consistente
- a galeria continua acessivel mesmo com erro estrutural

## Observacao
`galleryStatus` e diferente de `coverStatus`:
- `galleryStatus` trata a integridade estrutural do import
- `coverStatus` trata a resolucao editorial da capa
