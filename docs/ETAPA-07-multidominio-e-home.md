# ETAPA 07 — Multidominio e home

## Objetivo
Adicionar suporte a multiplos dominios com home propria e vitrine separada por dominio, mantendo um unico motor de aplicacao.

## Como funciona o mapeamento de dominio
- `app/data/domains.json` define os dominios conhecidos
- cada dominio tem `domain`, `name` e `catalog`
- o servidor identifica o dominio ativo a partir do header `Host`
- se o host nao for reconhecido, o sistema usa um fallback seguro baseado no primeiro dominio configurado com galerias disponiveis

## Como funciona o catalogo por dominio
- cada galeria em `app/data/galleries.json` agora possui o campo `catalog`
- o valor de `catalog` conecta a galeria a um dominio especifico
- as rotas de API, vitrine, entrada e galeria final passam a filtrar galerias pelo catalogo do dominio ativo
- isso impede mistura de galerias entre dominios diferentes

## Como a home se encaixa no fluxo
- `GET /` e a home simples do dominio
- a home apresenta o nome do dominio e o link para `GET /vitrine`
- `GET /vitrine` mostra somente as galerias do catalogo do dominio atual
- `GET /g/:slug` continua como pagina de entrada da galeria
- `GET /gallery/:slug` continua como placeholder da galeria final

## Limitacoes atuais
- ainda nao existe infraestrutura real de multidominio aplicada em Nginx, DNS ou servidor
- a identificacao de dominio depende apenas do header `Host`
- galerias privadas continuam apenas sinalizadas visualmente
- a galeria final ainda e placeholder
