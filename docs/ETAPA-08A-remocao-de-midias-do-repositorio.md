# ETAPA 08A — Remocao de midias do repositorio

## Objetivo
Remover arquivos de imagem do Git e manter apenas a estrutura esperada de imports no repositorio, sem quebrar o funcionamento do app.

## Por que imagens nao ficam no Git
- imagens de galerias aumentam rapido o tamanho do repositorio
- o repositorio deve guardar codigo, configuracao e estrutura operacional
- as midias podem ser colocadas diretamente no servidor ou em um ambiente de deploy sem precisar versionar binarios grandes

## Como as imagens devem ser colocadas no servidor
- manter a estrutura de pastas esperada em `data/imports/`
- copiar os arquivos exportados do Lightroom Classic para:
  - `images/thumbnails/`
  - `images/large/`
- manter os mesmos nomes de arquivo nas duas pastas para que o app consiga relacionar thumbnail e imagem grande

## Impacto no fluxo de trabalho
- localmente, o app continua funcionando mesmo sem imagens, mas passa a mostrar a mensagem `Galeria sem imagens disponiveis`
- no servidor, as imagens devem existir fora do Git dentro da estrutura local do projeto
- o fluxo passa a ser:
  - codigo e estrutura via Git
  - midias por copia controlada no servidor
