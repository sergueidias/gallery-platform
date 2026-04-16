# AGENTS

## Objetivo do projeto
- Construir um sistema de galerias fotograficas mobile-first.
- Suportar vitrines por dominio e acesso por senha por galeria.
- Usar um unico motor para multiplos dominios, com catalogos separados por dominio.
- Tratar o Lightroom Classic como origem dos imports.

## Regras operacionais
- Trabalhar uma etapa pequena por vez.
- Manter as mudancas minimas, reversiveis e restritas a este repositorio.
- Nao instalar dependencias sem solicitacao explicita.
- Nao criar a aplicacao antes da etapa apropriada.
- Nao tocar em infraestrutura.
- Evitar complexidade prematura e scaffolding excessivo.

## Limites inegociaveis
- Nunca tocar em Nginx.
- Nunca tocar em Docker.
- Nunca tocar em /opt/evolution.
- Nunca tocar em n8n.
- Nunca tocar em Redis.
- Nunca tocar em PostgreSQL.
- Nunca tocar em DNS.
- Nunca tocar em portas do sistema.
- Nunca alterar nada fora deste repositorio.

## Forma de execucao
- Toda etapa deve terminar com documentacao em `docs/`.
- Toda etapa deve parar para revisao humana antes de passos maiores.
- Preferir ajustes incrementais que alinhem o repositorio com a documentacao existente.
