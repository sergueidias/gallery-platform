# ETAPA 13A — Ajuste de uso de paths

## Motivo do ajuste
Os campos normalizados de import foram adicionados na API como preparacao de pipeline, mas o front ainda nao precisa consumir esses paths diretamente.

Usar `thumbnailsPathNormalized` no HTML da vitrine neste momento antecipava uma responsabilidade que ainda nao gera efeito visual nem funcional real.

## Separacao entre preparacao de API e consumo no front
- a API continua expondo caminhos normalizados
- o front continua usando apenas `coverUrl` como fonte da imagem
- a preparacao do pipeline permanece no servidor
- o consumo desses paths pode ser ativado depois, quando houver necessidade real no front
