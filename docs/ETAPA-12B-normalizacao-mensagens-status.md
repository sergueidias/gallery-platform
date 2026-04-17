# ETAPA 12B — Normalizacao de mensagens de status

## Diferenca entre codigo interno e mensagem publica
- codigo interno: valor tecnico usado pelo sistema para logica e decisao
- mensagem publica: texto curto e legivel usado na API e na interface

Os codigos internos continuam inalterados.

## Mapeamentos criados
Foram adicionadas tres funcoes no servidor:
- `getCoverStatusMessage(status)`
- `getGalleryStatusMessage(status)`
- `getGalleryOperationalStatusMessage(status)`

Essas funcoes geram mensagens publicas curtas, neutras e consistentes a partir dos codigos internos.

## Uso na API e na interface
A API agora devolve, alem dos codigos:
- `coverStatusMessage`
- `galleryStatusMessage`
- `galleryOperationalStatusMessage`

Na interface:
- o badge operacional usa `galleryOperationalStatusMessage`
- os codigos internos continuam disponiveis para a logica existente
