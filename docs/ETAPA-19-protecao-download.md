# ETAPA 19 — Protecao leve de download

## Regra de acesso
O endpoint `/api/gallery-download` agora respeita o estado de privacidade da galeria.

## Comportamento por tipo de galeria
- galeria publica: download continua liberado
- galeria privada com acesso autorizado: download permitido
- galeria privada sem acesso autorizado: resposta `403`

Resposta de bloqueio:

```json
{
  "status": "forbidden",
  "message": "Access denied"
}
```

## Integracao com o cookie existente
Nao foi criado um mecanismo novo.

O endpoint reutiliza o mesmo cookie temporario ja usado para acesso a galerias privadas no fluxo atual:
- autenticacao feita em `/access/:slug`
- cookie validado no servidor
- autorizacao reaproveitada em `/api/gallery-download`
