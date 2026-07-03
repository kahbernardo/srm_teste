# ADR-003: Monolith-First Approach

**Status**: Accepted  
**Date**: 2026-07-03  
**Deciders**: Kaique Bernardo  
**Tags**: #architecture #deployment #monolith #mvp

**Relacionado**: [ADR-001: Stack Selection](./001-stack-selection.md), [ADR-002: SQL vs NoSQL](./002-sql-vs-nosql.md)

## Context

O SRM Credit Engine é um MVP com timeline de 7 semanas, desenvolvido por um especialista solo, com 67 issues distribuídas em 6 milestones. Os domínios de negócio estão fortemente acoplados:

- **Pricing** depende de `AssetType` e `PricingStrategy`
- **Câmbio** depende de `ExchangeRate` e `Currency`
- **Settlement** orquestra pricing + câmbio em uma única transação ACID

Separar esses domínios em microserviços desde o início implicaria:

- Transações distribuídas (sagas) para operações que hoje cabem em um `prisma.$transaction()`
- Infraestrutura adicional: service mesh, distributed tracing, message broker, API gateway
- Overhead operacional incompatível com equipe de uma pessoa

O repositório já usa **Turborepo** com `apps/backend` e `apps/web`, mas isso é separação de código, não de deploy.

## Decision

Adotamos a abordagem **Modular Monolith** — um backend deployável com camadas internas bem definidas.

### Topologia

```
srm-credit-engine/          (monorepo Turborepo)
├── apps/backend/           → 1 deployável (API Fastify)
│   ├── presentation/       → Controllers, Routes, Middlewares
│   ├── business/           → Services, Strategies
│   └── persistence/        → Prisma Client
├── apps/web/               → 1 deployável (Next.js)
└── packages/shared/        → Types compartilhados
```

### Princípios

1. **Um processo backend** — toda lógica de pricing, câmbio e settlement no mesmo serviço
2. **Camadas internas** — dependência unidirecional: `presentation → business → persistence`
3. **Frontend separado** — `apps/web` é app distinto no monorepo, comunica via HTTP REST
4. **Sem message broker** — comunicação síncrona no MVP; filas apenas quando volume exigir
5. **Banco compartilhado** — PostgreSQL único, transações locais (sem distributed transactions)

### Infraestrutura

O `docker-compose.yml` reflete essa decisão:

- PostgreSQL como serviço de dados compartilhado
- Backend e frontend comentados (deploy monolítico planejado, não microserviços separados por domínio)

### Boundaries modulares (preparação para extração futura)

| Módulo | Pacote lógico | Acoplamento |
|--------|---------------|-------------|
| Currency Engine | `business/services/` + models `Currency`, `ExchangeRate` | Baixo |
| Pricing Engine | `business/pricing/` + `PricingStrategyFactory` | Médio |
| Settlement | `business/services/transaction.service.ts` | Alto (orquestra tudo) |

## Consequences

### Positivas

1. **Simplicidade operacional** — um deploy, um log stream, um health check
2. **Transações locais** — ACID nativo sem saga pattern ou eventual consistency
3. **Velocidade de entrega** — sem overhead de contratos entre serviços (REST/gRPC interno)
4. **Debug trivial** — stack trace único, sem distributed tracing obrigatório
5. **Monorepo** — types compartilhados entre front e back sem publicar pacotes

### Negativas

1. **Scaling vertical primeiro** — escalar = réplica do monólito inteiro, não só pricing
2. **Deploy acoplado** — mudança em settlement exige redeploy do backend completo
3. **Risco de big ball of mud** — sem disciplina nas camadas, boundaries se dissolvem

### Mitigações

- Camadas 3-tier enforced por estrutura de pastas e code review
- Strategy Pattern no pricing isola variações sem microserviço
- Testes de integração garantem contratos internos entre camadas
- Monorepo permite extrair módulo para pacote npm interno antes de extrair serviço

## Evolution Strategy

Microserviços serão considerados **somente** quando gatilhos objetivos forem atingidos:

| Gatilho | Threshold |
|---------|-----------|
| Volume sustentado | >10k transações/dia por 30 dias consecutivos |
| Equipe | >3 desenvolvedores ativos no backend |
| SLA de latência | p99 >50ms em precificação com monólito otimizado |
| Deploy frequency | Necessidade de deploy independente por domínio (>1x/dia por módulo) |

### Candidatos a extração (ordem sugerida)

1. **Pricing Engine** — CPU-bound, stateless após input; candidato a serviço Go/Rust se latência exigir
2. **Settlement Worker** — processamento assíncrono de liquidações em batch (fila + worker)
3. **Read Model / Analytics** — CQRS com read replica PostgreSQL para relatórios pesados

### O que NÃO extrair no curto prazo

- Currency Engine — volume baixo de writes, queries simples
- API Gateway — Fastify com rate limiting é suficiente no MVP
- Auth Service — não há requisito de SSO/multi-tenant no MVP

## Alternatives Considered

| Opção | Prós | Contras | Por que rejeitada |
|-------|------|---------|-------------------|
| Microservices desde dia 1 | Deploy independente, scaling por serviço | Sagas, tracing, broker, DevOps 3x | Timeline solo de 7 semanas |
| Serverless (Lambda/Functions) | Zero ops, auto-scale | Cold start, estado transacional complexo | Latência e ACID incompatíveis |
| CQRS + Event Sourcing | Audit trail nativo, read/write separation | Complexidade de modelagem e infra | Prematura sem volume de leitura |
| Modular Monorepo sem camadas | Flexibilidade máxima | Big ball of mud inevitável | 3-tier mitiga risco |

## References

- [ADR-001: Stack Selection](./001-stack-selection.md)
- [ADR-002: SQL vs NoSQL](./002-sql-vs-nosql.md)
- [Monolith First — Martin Fowler](https://martinfowler.com/bliki/MonolithFirst.html)
- `docker-compose.yml`
- `apps/backend/src/` (estrutura presentation/business/persistence)

## Sign-off

**Approved by**: Kaique Bernardo  
**Date**: 2026-07-03  
**Review Date**: 2026-10-03 (3 meses)
