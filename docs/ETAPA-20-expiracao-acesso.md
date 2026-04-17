# ETAPA 20 — Expiracao de acesso privado

## Tempo de validade
O acesso a galerias privadas passa a ter validade padrao de 2 horas.

Esse prazo vale para:
- o registro temporario em memoria no servidor
- o cookie de acesso enviado ao navegador

## Comportamento ao expirar
Se o acesso expirar, o sistema trata a galeria como nao autorizada.

Na pratica:
- a galeria privada deixa de abrir diretamente
- o endpoint protegido de download deixa de responder com sucesso
- o usuario precisa informar a senha novamente

## Impacto no fluxo
Fluxo valido:
1. usuario envia a senha correta
2. servidor cria token temporario
3. cookie recebe token com timestamp de expiracao
4. acessos privados seguem liberados ate o prazo acabar

Fluxo expirado:
1. cookie ainda existe ou e reenviado fora do prazo
2. `hasValidGalleryAccess` detecta expiracao
3. acesso e negado com o mesmo comportamento atual de nao autorizado
