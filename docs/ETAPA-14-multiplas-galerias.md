# ETAPA 14 — Multiplas galerias no catalogo

## Objetivo
Preparar o sistema para lidar com multiplas galerias reais dentro de um mesmo catalogo, preservando a arquitetura atual e adicionando uma validacao minima de integridade para `slug`.

## Regra de slug unico por catalogo
O campo `slug` precisa ser unico dentro de cada `catalog`.

Isso significa que:
- o mesmo `slug` pode existir em catalogos diferentes
- o mesmo `slug` nao pode se repetir dentro do mesmo catalogo

## Impacto no fluxo
`loadGalleries` agora verifica duplicidade de `slug` por `catalog` e adiciona o campo derivado `galleryIntegrityStatus` em cada galeria carregada.

Valores atuais:
- `ok`
- `error_duplicate_slug`

Esse campo passa a ser exposto em:
- resumo da galeria na API
- detalhe da galeria na API
- badge discreto na vitrine

## Comportamento em caso de erro
Se houver duplicidade de `slug` dentro do mesmo catalogo:
- a galeria recebe `galleryIntegrityStatus = error_duplicate_slug`
- a API continua respondendo
- a vitrine continua exibindo a galeria com indicativo discreto
- o acesso nao e bloqueado nesta etapa

Esta etapa registra o problema sem alterar a logica de capa, import, operacao ou multi-dominio.
