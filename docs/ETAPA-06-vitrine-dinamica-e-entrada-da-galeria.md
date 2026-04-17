# ETAPA 06 — Vitrine dinamica e entrada da galeria

## Objetivo
Ligar a vitrine ao catalogo real de galerias e criar a primeira pagina de entrada da galeria, preparando o fluxo vitrine -> entrada -> galeria.

## Rotas criadas e alteradas
- `GET /` continua sendo a vitrine, mas agora renderiza galerias reais a partir de `app/data/galleries.json`
- `GET /app.js` entrega o script leve que consome a API do catalogo
- `GET /g/:slug` entrega a pagina intermediaria de entrada da galeria
- `GET /gallery/:slug` entrega um placeholder simples para a galeria final
- `GET /api/galleries` continua retornando a lista de galerias, agora com URLs derivadas e capa resolvida
- `GET /api/gallery/:slug` continua retornando os dados da galeria e seus arquivos consistentes
- `GET /media/:slug/:file` entrega a capa da galeria a partir de `sourcePath`, com fallback local

## Como a vitrine agora usa dados reais
- a pagina inicial deixou de ter cards estaticos fixos
- o HTML fornece apenas a estrutura base e um estado inicial de carregamento
- `app/app.js` chama `GET /api/galleries`
- os cards sao montados a partir do catalogo JSON, com titulo, descricao, estado publico/privado e link para a pagina de entrada

## Como funciona a pagina intermediaria
- a rota `/g/:slug` usa o catalogo para localizar a galeria
- a pagina mostra capa, titulo, descricao e um CTA para seguir adiante
- quando `isPrivate` e `false`, a mensagem indica entrada direta
- quando `isPrivate` e `true`, a experiencia ja sinaliza acesso protegido, mas ainda sem senha real

## O que ainda falta implementar
- autenticacao real para galerias privadas
- galeria final com navegacao de fotos
- leitura de metadados completos do export do Lightroom
- experiencia real de download
- fluxo completo de capa automatica a partir do import
