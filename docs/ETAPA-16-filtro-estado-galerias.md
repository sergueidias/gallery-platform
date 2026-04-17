# ETAPA 16 — Filtro de estado das galerias

## Uso do parametro `status`
A rota `/api/galleries` passa a aceitar um filtro opcional por estado operacional da galeria.

Valores suportados:
- `status=ok`
- `status=error`

## Regras
- `status=ok` retorna apenas galerias com `galleryOperationalStatus = ok`
- `status=error` retorna apenas galerias com `galleryOperationalStatus != ok`
- sem o parametro `status`, a API mantém o comportamento atual e retorna todas as galerias do catalogo

## Exemplos de chamada
- `/api/galleries`
- `/api/galleries?status=ok`
- `/api/galleries?status=error`

## Impacto na API
O filtro e aplicado depois da ordenacao existente.

Nao houve mudanca:
- na estrutura do payload
- na logica dos status
- no front
