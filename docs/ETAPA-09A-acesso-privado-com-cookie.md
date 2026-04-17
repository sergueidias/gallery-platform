# ETAPA 09A — Acesso privado com cookie

## Por que o query param foi removido
O modelo com `?access=granted` era fragil porque expunha o estado de acesso na URL e permitia reuso manual do endereco sem qualquer controle minimo do lado do servidor.

## Como funciona o cookie temporario
- a pagina de entrada continua em `GET /g/:slug`
- galerias publicas seguem com acesso direto
- galerias privadas exibem formulario de senha
- `POST /access/:slug` valida a senha contra `app/data/galleries.json`
- quando a senha esta correta:
  - o servidor gera um token aleatorio simples
  - guarda esse token em memoria associado ao `slug` da galeria
  - define um cookie `HttpOnly` com validade curta
  - redireciona para `GET /gallery/:slug`
- `GET /gallery/:slug` verifica esse cookie quando a galeria e privada
- se o cookie nao existir ou estiver expirado, o usuario volta para `GET /g/:slug`

## O que isso resolve
- remove o acesso fraco baseado em query param
- coloca a decisao de autorizacao no servidor
- evita expor o estado de acesso diretamente na URL
- mantem a implementacao simples, sem banco e sem dependencia externa

## Limitacoes atuais
- as autorizacoes ficam so em memoria no `server.js`
- se o servidor reiniciar, os acessos expiram
- nao existe logout
- nao existe sessao persistente entre reinicios
- o mecanismo ainda e propositalmente simples para esta etapa
