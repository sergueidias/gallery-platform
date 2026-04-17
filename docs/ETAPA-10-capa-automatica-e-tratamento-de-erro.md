# ETAPA 10 — Capa automatica e tratamento de erro

## Regra de capa
A capa da galeria segue o workflow real do Lightroom Classic e e detectada por prioridade:

1. keyword `capa`
2. fallback: `title` exatamente `capa`
3. sinal auxiliar: nome tecnico ou tombo contendo `CAPA`

## Resultado da deteccao
- exatamente 1 candidata: capa valida
- 0 candidatas: `error_missing_cover`
- 2 ou mais candidatas: `error_multiple_covers`
- candidata encontrada, mas arquivo fisico ausente no import: `error_cover_file_missing`

## Estados de erro
O sistema usa os seguintes valores em `coverStatus`:
- `ok`
- `error_missing_cover`
- `error_multiple_covers`
- `error_cover_file_missing`

## Uso do fallback visual
Quando a capa nao pode ser resolvida corretamente, o sistema usa o fallback visual em:

- `app/assets/cover-error.svg`

Mesmo com erro de capa:
- a galeria continua visivel na vitrine
- a entrada da galeria continua acessivel
- a galeria final continua acessivel

## Distincao entre deteccao tecnica e representacao publica
A deteccao tecnica da capa depende apenas de:
- keyword
- title
- nome tecnico do arquivo

A representacao editorial da capa usa `publicName` e segue:

`[codigo do estudio] [nome da galeria]-CAPA`

Isso e representacao publica e branded. Nao e o criterio principal de deteccao.

## Impacto operacional no workflow
O workflow operacional esperado passa a ser:
- exportar LRcP
- manter thumbnails e large com nomes fisicos originais
- registrar metadados da galeria em `app/data/gallery-metadata/<slug>.json`
- garantir que exista uma unica capa valida segundo a regra do sistema

Se houver erro de capa, o sistema sinaliza o problema sem bloquear o uso da galeria.
