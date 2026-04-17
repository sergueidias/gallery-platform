# ETAPA 15 — Ordenacao de galerias

## Criterios de ordenacao
A API de vitrine agora retorna as galerias em ordem consistente, sem depender da ordem fisica do arquivo JSON nem da leitura do sistema.

Prioridades de ordenacao:
1. galerias com `galleryOperationalStatus = ok` primeiro
2. depois por `title` em ordem alfabetica
3. fallback por `slug`

## Impacto na vitrine
O front nao precisou ser alterado.

A vitrine continua consumindo `/api/galleries`, mas agora recebe a lista ja ordenada pelo servidor.

## Motivo da priorizacao por status
Galerias operacionalmente saudaveis aparecem primeiro para reduzir ruido visual e facilitar a navegacao inicial da vitrine.

Galerias com alerta ou erro continuam visiveis, mas aparecem depois das galerias sem pendencias operacionais.
