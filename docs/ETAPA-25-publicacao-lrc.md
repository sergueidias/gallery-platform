# ETAPA 25 — Publicacao LRc por script

## Objetivo
Publicar uma vitrine exportada do Lightroom Classic em `/var/www/gallery/vitrine/current` e publicar varias galerias em `/var/www/gallery/galeria/SLUG`, mantendo o layout do LRc e adicionando apenas o redirecionamento do loupe para a galeria correspondente.

## Script
O utilitario fica em [publish-lrc.sh](/Users/barbarella/Documents/Codex/gallery-platform/scripts/publish-lrc.sh).

Uso:

```bash
./publish-lrc.sh "/caminho/vitrine" "/caminho/pasta-com-galerias"
```

Variaveis opcionais:
- `PUBLISH_REMOTE_HOST`
- `PUBLISH_REMOTE_VITRINE_ROOT`
- `PUBLISH_REMOTE_GALERIA_ROOT`

## Convencao esperada de nomes
A correspondencia entre a capa da vitrine e a galeria usa o `exportFilename` da imagem aberta no loupe.

Normalizacao aplicada:
- remove extensao
- remove sufixo final `-CAPA`, `_CAPA` ou ` CAPA`
- converte para minusculas
- troca espacos e `_` por `-`
- remove caracteres fora de `[a-z0-9-]`
- colapsa hifens repetidos

Exemplos aceitos:
- `nude-armchair-CAPA.jpg` -> `nude-armchair`
- `nude_armchair_CAPA.webp` -> `nude-armchair`
- `Nude Armchair capa.png` -> `nude-armchair`

A pasta da galeria correspondente deve resultar na mesma chave normalizada.

## Comportamento
- a vitrine e copiada para `/var/www/gallery/vitrine/current`
- cada galeria e copiada para `/var/www/gallery/galeria/SLUG`
- o `assets/js/main.js` da vitrine recebe um patch pequeno que intercepta o clique no loupe e redireciona para `/galeria/SLUG/`
- o layout original do Lightroom e preservado; apenas o comportamento do clique e extendido
