# gallery-platform

Sistema próprio para entrega de galerias fotográficas via web.

Multi-domínio, sem framework, sem banco de dados, com controle de acesso
privado e ingestão via Lightroom Classic.

## Arquitetura
domínio → home → vitrine → entrada da galeria → galeria

## Princípios

- Sem framework
- Sem dependências desnecessárias
- Sem banco de dados
- Imagens fora do Git — apenas no servidor
- O sistema interpreta o export do Lightroom Classic, não gera conteúdo manual
- Mudanças pequenas, reversíveis e documentadas

## Entrada de dados — LRcP

O formato oficial de entrada é o **LRcP** (Lightroom Classic Pages export).
data/imports/<catalog>/<slug>/images/
thumbnails/
large/

O sistema extrai do export:
- Par `thumbnails/` + `large/` por imagem
- Metadados do array `LR.images` (id, exportFilename, title, caption)
- Sinal de capa via keyword `capa`

## Funcionalidades

- Multi-domínio com home e vitrine por domínio
- Catálogo por domínio
- Entrada de galeria antes da galeria final
- Acesso privado com cookie temporário
- Download protegido
- Manifesto de galeria
- Logs operacionais
- Capa automática via keyword Lightroom

## Stack

- Node.js puro — sem framework
- Nginx (proxy reverso)
- Sem Docker
- Sem banco de dados

## Infraestrutura

- VPS Hostinger KVM 1 — Ubuntu 24.04 LTS
- Caminho no servidor: `/opt/gallery-platform`
- Atualização via `git pull` no servidor

## Status

🔴 Código completo (bloco 24) — deploy pendente

## Documentação

Documentação técnica completa em `docs/` — 36 arquivos cobrindo
todos os blocos de implementação.
