# DEPLOY - KYOTO

## Data
18/04/2026

---

## Etapa 1 - Inspecao do servidor

### Resultado

- Estrutura confirmada:
  - app em `/opt/gallery-platform/app`
  - imports em `/opt/gallery-platform/data/imports`
- Arquivo correto:
  - `/opt/gallery-platform/app/data/galleries.json`
- Import raiz confirmado:
  - `/opt/gallery-platform/data/imports/default/nude-armchair`
- Contagem validada:
  - `LARGE=1`
  - `THUMBNAILS=1`

### Problema identificado

- `sourcePath` incorreto apontando para:
  - `data/imports/default/nude-armchair`
- Caminho correto deveria subir um nivel:
  - `../data/imports/default/nude-armchair`
- Como `galleries.json` fica dentro de `app/data/`, o caminho relativo correto para o import no nivel raiz do projeto precisava subir um nivel antes de entrar em `data/`.

### Estado encontrado

- `galleries.json` existia em `/opt/gallery-platform/app/data/galleries.json`
- `.env` ainda nao existia
- nao havia processo Node ativo para `/opt/gallery-platform/app/server.js`
- `pm2` nao estava disponivel no servidor
- configuracao do `nginx` estava sintaticamente valida, mas fora do escopo desta etapa

---

## Etapa 2 - Correcao de Path + .env

### Acoes executadas

- Backup criado:
  - `/opt/gallery-platform/app/data/galleries.json.bak`
- `sourcePath` corrigido para:
  - `../data/imports/default/nude-armchair`
- Criacao de `.env` com:
  - `APP_PORT=3000`
- `.env` minimo criado em:
  - `/opt/gallery-platform/.env`

### Conteudo final validado

`app/data/galleries.json`

```json
[
  {
    "slug": "nude-armchair",
    "catalog": "yuki",
    "title": "Nude Armchair",
    "description": "Galeria piloto baseada em export do Lightroom Classic.",
    "cover": null,
    "coverStatus": null,
    "isPrivate": false,
    "password": null,
    "allowDownload": false,
    "sourcePath": "../data/imports/default/nude-armchair"
  }
]
```

`.env`

```dotenv
APP_PORT=3000
```

### Escopo preservado

- nenhum ajuste em `nginx`
- nenhum ajuste em `dns`
- nenhum ajuste em `pm2` ou `systemd`
- nenhuma instalacao de dependencias

### Estado apos correcao

- Estrutura de paths consistente
- App apto a resolver imagens corretamente
- Configuracao minima definida

---

## Etapa 3 - Teste controlado

### Objetivo

Validar execucao do app localmente antes de expor via `nginx`.

### Acoes

- Subida temporaria via:
  - `nohup node app/server.js > /opt/gallery-platform/data/logs/gallery-test.log 2>&1 &`
- Testes realizados:
  - `/api/galleries`
  - `/api/gallery/nude-armchair`

### Resultado esperado

- API responde JSON
- Galeria carregada corretamente
- Logs sem erro critico

### Resultado real

- `node` nao estava disponivel no servidor
- `npm` nao estava disponivel no servidor
- o start temporario falhou
- os endpoints locais nao responderam porque nao houve processo ouvindo na porta `3000`
- o log confirmou a causa do bloqueio

### Evidencias

Saida do ambiente:

```text
bash: line 1: node: command not found
bash: line 1: npm: command not found
```

Saida do log:

```text
nohup: failed to run command 'node': No such file or directory
```

Estado final:

- nenhum daemon permanente foi criado
- porta `3000` permaneceu livre ao final do teste
- Processo nao persistido
- Nenhuma alteracao em `nginx` ou `dns`
- Ambiente isolado preservado

---

## Etapa 4 - Runtime Node instalado

### Resultado

- `node` instalado e funcional
- `npm` instalado e funcional
- caminhos confirmados:
  - `/usr/bin/node`
  - `/usr/bin/npm`

### Versoes finais

- Node.js: `v24.14.1`
- npm: `11.11.0`

### Observacao tecnica

A instalacao pretendia runtime LTS, mas o repositorio configurado levou ao canal `node_24.x`. O ambiente ficou funcional, porem essa escolha deve ser reavaliada antes da estabilizacao final em producao.

### Impacto

O servidor passou a ter runtime suficiente para executar o `gallery-platform` localmente.

---

## Etapa 5 - Primeira tentativa de execucao local

### Resultado

- runtime Node funcional
- tentativa de `npm install` falhou por ausencia de `package.json` em `/opt/gallery-platform`
- aplicacao nao respondeu em `127.0.0.1:3000`
- processo de teste nao permaneceu ativo
- log de teste nao trouxe erro util

### Erro observado

```text
npm ERR! enoent Could not read package.json: Error: ENOENT: no such file or directory, open '/opt/gallery-platform/package.json'
curl: (7) Failed to connect to 127.0.0.1 port 3000
```

---

## Conclusao operacional

O repositorio em KYOTO ficou com o catalogo corrigido e com `.env` minimo criado, ambos de forma reversivel e com backup. O bloqueio inicial para subir a aplicacao nao estava no catalogo nem no path do import: o impedimento imediato era a ausencia de `node` e `npm` no servidor. Com a instalacao do runtime, esse bloqueio foi removido.

## Estado atual do deploy

| Item | Status |
|------|--------|
| Codigo sincronizado | ✅ |
| sourcePath correto | ✅ |
| .env configurado | ✅ |
| App executa localmente | ❌ |
| Runtime Node | ✅ |
| PM2 / daemon | ❌ |
| Nginx (gallery) | ❌ |
| DNS gallery | ❌ |
| SSL | ❌ |

## Proxima etapa

- Subir aplicacao de forma persistente
- Configurar `nginx` para `gallery.serguei.com.br`
- Criar DNS na Hostinger
- Ativar SSL

## Proximo passo recomendado

Parar para revisao humana antes de qualquer passo maior.

Se a proxima etapa for autorizada, ela deve focar em validar a execucao local do app com o runtime agora disponivel. Depois disso, as etapas de daemon, `nginx`, `dns` e `ssl` podem ser tratadas separadamente, sem misturar escopos.
