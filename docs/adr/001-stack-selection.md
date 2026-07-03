# ADR-001: Stack Selection

**Status**: Accepted  
**Date**: 2026-07-03  
**Deciders**: Kaique Bernardo, Claude Sonnet 4.5  
**Tags**: #architecture #stack #database

## Context

O SRM Credit Engine é uma plataforma financeira de missão crítica que precisa:

1. **Precisão Decimal**: Operações monetárias sem erros de arredondamento
2. **Integridade Transacional**: Garantias ACID para liquidações financeiras
3. **Type Safety**: Tipagem forte para evitar bugs em operações críticas
4. **Performance**: Baixa latência (<100ms p95) para APIs de precificação
5. **Manutenibilidade**: Ecossistema maduro, documentação, comunidade ativa
6. **Escalabilidade**: Suportar crescimento de 1k → 100k transações/dia

Precisávamos decidir:
- **Backend**: Node.js vs Go vs Java
- **Frontend**: Next.js vs Remix vs SvelteKit
- **Database**: PostgreSQL vs MySQL vs MongoDB
- **ORM**: Prisma vs TypeORM vs Drizzle

## Decision

### Backend: Node.js 20 + TypeScript + Fastify

**Escolhido**: Node.js  
**Rejeitados**: Go, Java, Python

**Razões**:
✅ **Ecossistema TypeScript**: Compartilhamento de types entre frontend/backend  
✅ **I/O Performance**: Event loop ideal para APIs financeiras (I/O-bound)  
✅ **Maturidade**: npm tem 2M+ pacotes, incluindo libs financeiras (dinero.js, big.js)  
✅ **Time-to-market**: Desenvolvedores full-stack (TS no front + back)  
✅ **Fastify**: 20k req/s vs 15k req/s (Express), schema-based validation built-in

**Tradeoffs**:
❌ **CPU-bound tasks**: Go seria superior para cálculos pesados (mitigado: workers threads se necessário)  
❌ **Memory footprint**: Java teria melhor GC para heaps grandes (mitigado: PostgreSQL faz aggregations)

### Frontend: Next.js 14 (App Router) + TypeScript

**Escolhido**: Next.js  
**Rejeitados**: Remix, SvelteKit, Vite+React

**Razões**:
✅ **SSR/SSG**: SEO e performance out-of-the-box  
✅ **App Router**: Server Components reduzem bundle size (~30%)  
✅ **TypeScript**: Type safety end-to-end  
✅ **Ecossistema**: shadcn/ui, Vercel ecosystem, maior comunidade

**Tradeoffs**:
❌ **Learning curve**: App Router é relativamente novo (mitigado: documentação excelente)  
❌ **Vendor lock-in**: Algumas features otimizadas para Vercel (mitigado: compatível com Docker)

### Database: PostgreSQL 16

**Escolhido**: PostgreSQL  
**Rejeitados**: MySQL, MongoDB, CockroachDB

**Razões**:
✅ **ACID Compliance**: Isolamento SERIALIZABLE para transações financeiras  
✅ **NUMERIC Type**: Precision arbitrária (NUMERIC(18,6)) sem erros de float  
✅ **JSON Support**: Flexibilidade para metadata sem migrar para NoSQL  
✅ **Performance**: Query planner avançado, índices GiST/GIN  
✅ **Maturidade**: 30+ anos, battle-tested em bancos e fintechs  
✅ **Features**: Window functions, CTEs, materialized views

**Tradeoffs**:
❌ **Horizontal Scaling**: MySQL tem Vitess, Postgres tem Citus (mais complexo)  
❌ **Write throughput**: MongoDB seria superior para writes massivos (não é nosso caso)

**Por que NÃO NoSQL**:
- **ACID**: MongoDB só garante ACID em single-document (precisamos de multi-table transactions)
- **Schema Enforcement**: Precisamos de foreign keys e constraints para integridade referencial
- **Decimal Precision**: MongoDB usa IEEE 754 floats (erros de arredondamento inaceitáveis)

### ORM: Prisma

**Escolhido**: Prisma  
**Rejeitados**: TypeORM, Drizzle, Sequelize

**Razões**:
✅ **Type Safety**: Generated types sincronizados com schema  
✅ **Migrations**: Declarativas, versionadas, rollback support  
✅ **Developer Experience**: Prisma Studio, autocomplete, error messages  
✅ **Performance**: Query engine em Rust, N+1 prevention  
✅ **Raw SQL**: Escape hatch para queries otimizadas (`prisma.$queryRaw`)

**Tradeoffs**:
❌ **Query Builder Limitations**: Queries complexas requerem raw SQL (aceitável)  
❌ **Schema Language**: Não é SQL puro (mas gera migrations SQL)

## Consequences

### Positivas

1. **Full-Stack TypeScript**: DX superior, menos context switching
2. **Type Safety**: Prisma types propagam erros de schema para runtime
3. **Comunidade**: Stack popular, fácil contratar, muitos recursos
4. **Produtividade**: Turborepo + TypeScript + Prisma = rapid development
5. **Confiabilidade**: PostgreSQL ACID garante zero data loss

### Negativas

1. **Curva de aprendizado**: Next.js App Router é relativamente novo
2. **Overhead**: Node.js usa mais memória que Go (~50MB vs ~10MB base)
3. **Build time**: TypeScript compilation adiciona ~10s ao build

### Mitigações

- **Performance**: Fastify + Prisma são fast enough (99% das apps não precisam de Go)
- **Escalabilidade**: PostgreSQL Read Replicas + Redis cache (quando necessário)
- **CPU-bound**: Workers threads ou offload para microserviço Go (futuro)

## Compliance

**Ambiente Financeiro**:
✅ Tipagem forte (TypeScript)  
✅ ACID compliance (PostgreSQL)  
✅ Decimal precision (NUMERIC)  
✅ Auditability (Prisma migrations versionadas)  
✅ Ecossistema maduro (Node.js LTS, PostgreSQL 30+ anos)

## Alternatives Considered

| Stack          | Pros                          | Cons                          | Rejected Why                |
|----------------|-------------------------------|-------------------------------|-----------------------------|
| Go + PostgreSQL| Performance, low memory       | Menos libs financeiras, ORM fraco | Produtividade < Node.js     |
| Java + Spring  | Enterprise-grade, JDBC        | Verbose, lento para iterar    | Overkill para MVP           |
| Python + FastAPI| ML libs, simplicidade        | GIL limita concorrência       | Performance API insuficiente|
| MySQL          | Replicação simples            | NUMERIC precision inferior    | PostgreSQL superior         |
| MongoDB        | Horizontal scaling fácil      | ACID limitado, float precision| Inadequado para finanças    |

## References

- [PostgreSQL NUMERIC Type](https://www.postgresql.org/docs/current/datatype-numeric.html)
- [Fastify Benchmarks](https://fastify.dev/benchmarks/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Why Not MongoDB for Financial Apps](https://www.mongodb.com/blog/post/why-you-should-never-use-mongodb)

## Sign-off

**Approved by**: Kaique Bernardo  
**Date**: 2026-07-03  
**Review Date**: 2026-10-03 (3 meses)
