# MANUTENCAO POR IA

## Principio geral
A IA deve trabalhar em etapas pequenas, legiveis e reversiveis. O objetivo e manter o projeto evoluindo sem introduzir acoplamentos desnecessarios, mudancas opacas ou risco fora do repositorio.

## O que uma IA pode alterar com seguranca
- arquivos do app dentro deste repositorio
- arquivos de documentacao em `docs/`
- catalogos e metadados locais, como `app/data/galleries.json`
- estrutura local de imports em `data/imports/`
- ajustes pequenos de HTML, CSS e JavaScript nativo
- validacoes e rotas locais do servidor Node.js minimo

## O que uma IA nao pode tocar
- Nginx
- Docker
- `/opt/evolution`
- n8n
- Redis
- PostgreSQL
- DNS
- portas do sistema
- configuracoes de servidor fora deste repositorio
- qualquer arquivo fora deste repositorio
- instalacao de dependencias sem autorizacao explicita

## Checklist antes de qualquer mudanca
- confirmar o objetivo exato da etapa
- confirmar que a mudanca cabe neste repositorio
- distinguir se a tarefa e de conteudo/metadados ou de estrutura/codigo
- localizar os arquivos realmente envolvidos antes de editar
- manter o menor diff possivel
- evitar scaffolding excessivo e complexidade prematura
- garantir que a etapa pode parar para revisao humana ao final

## Checklist de validacao depois da mudanca
- revisar o diff final
- verificar se nao houve alteracao fora do escopo pedido
- confirmar que a documentacao da etapa foi atualizada quando necessario
- validar sintaxe e comportamento local de forma simples, sem instalar dependencias
- registrar claramente o que funciona e o que ainda nao foi implementado

## Checklist de deploy
- revisar `git status`
- revisar os arquivos alterados
- confirmar que a etapa foi aprovada humanamente
- confirmar que nao existe mudanca incidental de infraestrutura
- so depois seguir o fluxo local -> push -> servidor -> pull

## Diferenca entre tipos de mudanca
### A. Ajuste de conteudo ou metadados
Inclui:
- alterar titulo, descricao ou slug
- mudar `cover`
- ajustar `isPrivate`
- ajustar `allowDownload`
- apontar ou corrigir `sourcePath`

Esse tipo de ajuste deve priorizar:
- edicao minima
- nenhuma alteracao de comportamento estrutural
- preservacao do formato dos arquivos de dados

### B. Ajuste estrutural ou codigo
Inclui:
- mudar `app/server.js`
- adicionar rota
- alterar fluxo de leitura dos imports
- mudar HTML, CSS ou comportamento da vitrine

Esse tipo de ajuste exige:
- revisao de impacto
- validacao local simples
- documentacao da etapa
- cuidado adicional para nao misturar refatoracao desnecessaria com a entrega pedida

## Convencoes do projeto
- keyword `capa` no nome do arquivo ou titulo `capa` pode funcionar como sinal de capa
- `isPrivate` indica se a galeria deve ser tratada como privada
- `allowDownload` indica a politica prevista de download
- `sourcePath` aponta para a origem local da galeria em `data/imports/`

Essas convencoes ajudam a IA a agir com consistencia, mesmo antes de existir automacao completa.

## Regra permanente
Sempre trabalhar em etapas pequenas e reversiveis. Quando houver duvida, preferir a opcao mais simples, documentar a decisao e parar para revisao antes de passos maiores.
