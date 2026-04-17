# PROJECT STATE — gallery-platform

## Identidade do projeto

Sistema próprio para entrega de galerias fotográficas via web, com múltiplos domínios, controle de acesso e ingestão via Lightroom Classic.

---

## Arquitetura

domínio → home → vitrine → entrada da galeria → galeria

Multi-domínio:
- cada domínio possui sua própria vitrine
- galerias separadas por catálogo

Fonte de dados:
- Lightroom Classic (export)
- sistema não edita conteúdo, apenas interpreta

Estrutura:
- app/ → aplicação
- data/imports/ → origem das imagens

---

## Estado atual do sistema

- multi-domínio funcionando
- home por domínio implementada
- vitrine dinâmica por catálogo
- entrada de galeria implementada
- galeria com visualização real de imagens
- imagens fora do Git (armazenadas no servidor)
- acesso privado com cookie temporário (sem query param)

## Input oficial atual

- LRcP e o formato oficial atual de ingestao
- imagens ficam fora do Git
- o sistema interpreta o export, nao usa o frontend do LRc

---

## Regras críticas

- não usar framework
- não instalar dependências desnecessárias
- não tocar em infraestrutura (Nginx, Docker, etc.)
- manter tudo simples, legível e reversível
- trabalhar por blocos
- cada etapa deve gerar documentação em docs/

Workflow de mídia:
- imagens vêm do Lightroom Classic
- sistema não gera conteúdo manual

Regra de capa:
- definida por keyword "capa"
- erro se 0 ou múltiplas imagens com essa keyword
- fallback com capa genérica

---

## Próximo passo

BLOCO 10 — sistema automático de CAPA

- detectar imagem com keyword "capa"
- tratar erro (0 ou múltiplas)
- aplicar fallback
- refletir na vitrine e entrada da galeria
