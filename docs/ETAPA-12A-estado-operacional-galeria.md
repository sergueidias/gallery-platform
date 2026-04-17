# ETAPA 12A — Estado operacional da galeria

## Objetivo
Criar um campo derivado `galleryOperationalStatus` para consolidar o estado operacional da galeria a partir de `galleryStatus` e `coverStatus`.

## Diferenca entre os estados
- `galleryStatus`: trata a integridade estrutural do import LRcP
- `coverStatus`: trata a resolucao editorial e tecnica da capa
- `galleryOperationalStatus`: resume o estado final da galeria para uso mais simples na interface

## Regra de prioridade
A prioridade e:

1. se `galleryStatus !== 'ok'`, usar `galleryStatus`
2. senao, se `coverStatus !== 'ok'`, usar `coverStatus`
3. senao, usar `ok`

## Uso na interface
- a API passa a devolver `galleryOperationalStatus`
- a vitrine usa esse campo para exibir um badge discreto quando houver qualquer alerta operacional
- os campos originais continuam existindo e nao foram substituidos
