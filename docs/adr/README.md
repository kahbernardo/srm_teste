# Architecture Decision Records (ADRs)

Registro de decisões arquiteturais do SRM Credit Engine.

| ADR | Título | Status | Data |
|-----|--------|--------|------|
| [001](./001-stack-selection.md) | Stack Selection | Accepted | 2026-07-03 |
| [002](./002-sql-vs-nosql.md) | SQL vs NoSQL | Accepted | 2026-07-03 |
| [003](./003-monolith-first.md) | Monolith-First Approach | Accepted | 2026-07-03 |
| [004](./004-pricing-strategy-pattern.md) | Pricing Strategy Pattern | Accepted | 2026-07-03 |
| [005](./005-event-sourcing-vs-crud.md) | Event Sourcing vs CRUD | Accepted | 2026-07-03 |
| [006](./006-microservices-vs-monolith.md) | Microservices vs Modular Monolith | Accepted | 2026-07-03 |
| [007](./007-sync-vs-async.md) | Synchronous vs Asynchronous Processing | Accepted | 2026-07-03 |

## Formato

Cada ADR segue a estrutura:

1. **Context** — problema e forças em jogo
2. **Decision** — o que foi decidido
3. **Consequences** — impactos positivos, negativos e mitigações
4. **Alternatives Considered** — opções rejeitadas e por quê
5. **References** — links e arquivos relacionados
6. **Sign-off** — aprovação e data de revisão

## Como adicionar um novo ADR

1. Criar arquivo `00N-titulo-kebab-case.md` nesta pasta
2. Atualizar esta tabela
3. Adicionar link na seção ADRs do [README](../../README.md)
