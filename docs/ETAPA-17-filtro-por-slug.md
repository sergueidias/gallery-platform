# ETAPA 17 — Filtro por slug

## Uso do parametro `slug`
A rota `/api/galleries` passa a aceitar um filtro opcional por `slug`, permitindo retornar apenas uma galeria especifica dentro do catalogo ativo.

## Regras
- `slug=<slug>` retorna apenas a galeria correspondente
- se o `slug` nao existir no catalogo atual, a API retorna lista vazia
- sem o parametro `slug`, a API mantém o comportamento atual

## Ordem de aplicacao
O filtro por `slug` e aplicado antes do filtro por `status`.

Isso permite combinacoes como:
- `/api/galleries?slug=nude-armchair`
- `/api/galleries?slug=nude-armchair&status=ok`
- `/api/galleries?slug=nude-armchair&status=error`

## Comportamento quando nao encontrado
Se o `slug` informado nao existir no catalogo resolvido para o dominio atual, o payload continua valido e a chave `galleries` retorna `[]`.
