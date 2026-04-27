# Dataroom Declarativo

## Objetivo
Adicionar ao repositório um gerador local e idempotente de dataroom baseado em JSON, com foco em:

- criar automaticamente subpastas
- criar `README.md` dentro de cada pasta
- suportar `--dry-run`
- nao duplicar pastas ja existentes
- emitir relatorio final da execucao

## Arquivos adicionados
- `structure.json`
- `create_drive_dataroom.py`
- `requirements.txt`

## Estrutura declarativa
O arquivo `structure.json` define a arvore completa do dataroom.

Cada no aceita:
- `name`: nome da pasta
- `title`: titulo amigavel usado no `README.md`
- `description`: descricao curta da finalidade da pasta
- `children`: lista opcional de subpastas

## Comportamento do script
O script `create_drive_dataroom.py`:

- valida a estrutura JSON antes de criar qualquer pasta
- cria a raiz do dataroom e todas as subpastas declaradas
- cria `README.md` em cada pasta quando ele ainda nao existe
- preserva pastas e `README.md` ja existentes
- imprime um relatorio final em JSON no stdout
- pode salvar esse relatorio em arquivo com `--report-file`
- em `--dry-run`, apenas simula as acoes

## Comandos de validacao local
Dry run:

```bash
python3 create_drive_dataroom.py --dry-run --target-dir ./tmp-dataroom
```

Criacao real:

```bash
python3 create_drive_dataroom.py --target-dir ./tmp-dataroom --report-file ./tmp-dataroom-report.json
```

Reexecucao idempotente:

```bash
python3 create_drive_dataroom.py --target-dir ./tmp-dataroom --report-file ./tmp-dataroom-report-second-run.json
```

## Validacao realizada nesta etapa
Validacao manual executada em `2026-04-27`:

- `python3 -m py_compile create_drive_dataroom.py`
- `python3 create_drive_dataroom.py --dry-run --target-dir /tmp/gallery-platform-dataroom-test`
- `python3 create_drive_dataroom.py --target-dir /tmp/gallery-platform-dataroom-test --report-file /tmp/gallery-platform-dataroom-test/report.json`
- segunda execucao no mesmo diretorio para confirmar que nenhuma pasta ou `README.md` foi duplicado

## Resultado observado
Na primeira execucao real:
- `24` diretorios criados
- `24` arquivos `README.md` criados

Na segunda execucao sobre o mesmo destino:
- `0` diretorios criados
- `24` diretorios reconhecidos como existentes
- `0` novos `README.md`
- `24` `README.md` reconhecidos como existentes

## Observacoes
- O nome do script menciona "drive", mas a implementacao desta etapa trabalha no sistema de arquivos local, sem integrar APIs externas.
- O utilitario usa apenas biblioteca padrao do Python.
