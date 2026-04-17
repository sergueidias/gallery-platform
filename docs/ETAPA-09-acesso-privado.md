# ETAPA 09 — Acesso privado

## Como funciona o fluxo
- a pagina de entrada continua em `GET /g/:slug`
- se `isPrivate` for `false`, a entrada segue direto para `GET /gallery/:slug`
- se `isPrivate` for `true`, a pagina de entrada mostra um campo de senha e envia `POST /access/:slug`
- o servidor compara a senha enviada com o campo `password` da galeria em `app/data/galleries.json`
- se a senha estiver correta, o usuario e redirecionado para `GET /gallery/:slug?access=granted`
- se estiver incorreta, o usuario volta para `GET /g/:slug?error=invalid-password`

## Como a galeria final protege acesso
- para galerias publicas, `GET /gallery/:slug` continua acessivel diretamente
- para galerias privadas, `GET /gallery/:slug` exige `?access=granted`
- se esse query param nao existir, a rota redireciona de volta para a pagina de entrada

## Limitacoes atuais
- nao existe sessao
- nao existe cookie
- nao existe token
- o controle depende apenas do query param `access=granted`
- isso e suficiente para esta etapa, mas nao deve ser tratado como mecanismo final de seguranca

## Proximos passos
- substituir o query param por sessao simples ou cookie assinado
- proteger melhor o fluxo de galerias privadas
- integrar o acesso privado com a futura politica de download
