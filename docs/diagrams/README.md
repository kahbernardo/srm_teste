# Diagramas de Arquitetura

Diagramas C4 do SRM Credit Engine.

| Arquivo | Descrição |
|---------|-----------|
| [c4-context.png](./c4-context.png) | Diagrama de Contexto — atores e sistemas externos |
| [c4-container.png](./c4-container.png) | Diagrama de Container — apps e banco de dados |
| [er-diagram.png](./er-diagram.png) | Diagrama Entidade-Relacionamento — modelagem de dados |
| [c4-context.puml](./c4-context.puml) | Fonte PlantUML — contexto |
| [c4-container.puml](./c4-container.puml) | Fonte PlantUML — container |
| [er-diagram.puml](./er-diagram.puml) | Fonte PlantUML — ER diagram |

## Regenerar PNGs

Requisito: Docker.

```bash
docker run --rm -v "$(pwd)/docs/diagrams:/data" plantuml/plantuml \
  -tpng /data/c4-context.puml /data/c4-container.puml /data/er-diagram.puml
```

Os arquivos `.puml` usam [C4-PlantUML](https://github.com/plantuml-stdlib/C4-PlantUML) via include remoto.

## Referências

- [C4 Model](https://c4model.com/)
- [ADR-003: Monolith-First](../adr/003-monolith-first.md)
