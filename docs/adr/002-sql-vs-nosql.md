# ADR-002: SQL vs NoSQL

**Status**: Accepted  
**Date**: 2026-07-03  
**Deciders**: Kaique Bernardo  
**Tags**: #architecture #database #persistence #acid

**Relacionado**: [ADR-001: Stack Selection](./001-stack-selection.md)

## Context

O SRM Credit Engine liquida ativos financeiros (duplicatas, cheques, recebíveis) com precisão monetária e garantias transacionais. Uma operação de cessão envolve múltiplas entidades relacionadas em uma única unidade de trabalho atômica:

```
Currency → ExchangeRate → AssetType → PricingStrategy → Transaction
```

Requisitos da camada de persistência:

1. **ACID multi-tabela**: rollback automático se qualquer etapa falhar (pricing, câmbio ou persistência)
2. **Integridade referencial**: foreign keys entre `transactions`, `asset_types`, `currencies` e `exchange_rates`
3. **Precisão decimal**: valores monetários sem erros de arredondamento (`NUMERIC(18,6)` para taxas, `Decimal(18,2)` para valores)
4. **Concorrência controlada**: optimistic locking via campo `version` em liquidações simultâneas
5. **Auditoria**: histórico de alterações via `AuditLog`

Volume esperado: 1k–100k transações/dia. O perfil é transacional com consistência forte, não ingestão massiva de eventos em escala web.

## Decision

Adotamos **PostgreSQL 16** como SGBD relacional em produção, com **Prisma** como ORM.

### PostgreSQL em produção

- Schema definido em `apps/backend/prisma/schema.prisma.postgres`
- Tipos `Decimal` mapeados para `NUMERIC` no banco
- Enum `TransactionStatus` com constraint no nível do banco
- Índices em `status`, `created_at` e `external_reference` para queries operacionais

### Prisma como camada de acesso

- Prepared statements automáticos (zero raw SQL no código de produção)
- Migrations versionadas e `db push` para ambientes de teste
- Client gerado com type safety end-to-end

### SQLite apenas para desenvolvimento local

- `apps/backend/prisma/schema.prisma` aponta para `dev.db` para iteração rápida sem Docker
- Testes de integração e produção usam exclusivamente o schema PostgreSQL via Testcontainers

### Evidências no código

**Transação ACID** — `TransactionService` envolve criação e liquidação em `prisma.$transaction()`:

```typescript
// apps/backend/src/business/services/transaction.service.ts
return await this.db.$transaction(async (tx) => {
  const assetType = await tx.assetType.findUnique({ ... });
  const exchangeRate = await tx.exchangeRate.findFirst({ ... });
  const transaction = await tx.transaction.create({ ... });
});
```

**Integridade referencial e precisão** — modelo `Transaction` em `schema.prisma.postgres`:

- FKs para `assetType`, `currency` e `targetCurrency`
- `faceValue`, `discountAmount`, `netAmount` como `Decimal @db.Decimal(18, 2)`
- `version Int @default(1)` para optimistic locking

**Validação em testes** — 15 testes de integração com PostgreSQL real (`transaction.integration.test.ts`):

- Rollback quando asset type inválido, taxa inexistente ou pricing ausente
- Commit atômico com conversão cambial
- Concorrência via optimistic locking e double-settle prevention

## Consequences

### Positivas

1. **Zero perda de dados** em falhas parciais — rollback garantido pelo PostgreSQL
2. **Constraints no banco** — FKs impedem transações órfãs mesmo com bug na aplicação
3. **Precisão monetária** — `NUMERIC` elimina erros de ponto flutuante
4. **Testabilidade** — Testcontainers valida comportamento ACID contra Postgres real, não mock
5. **Evolução de schema** — migrations Prisma versionadas e auditáveis

### Negativas

1. **Scaling horizontal** — sharding é mais complexo que em bancos NoSQL distribuídos nativamente
2. **Schema rígido** — alterações exigem migration (aceitável em domínio financeiro regulado)
3. **Dual schema** — manutenção de `schema.prisma` (SQLite) e `schema.prisma.postgres` em paralelo

### Mitigações

- Read replicas PostgreSQL quando volume de leitura exigir (relatórios analíticos)
- Redis como cache de taxas de câmbio (futuro, sem alterar modelo relacional)
- SQLite restrito a dev local; CI e produção sempre PostgreSQL

## Alternatives Considered

| Opção | Prós | Contras | Por que rejeitada |
|-------|------|---------|-------------------|
| MongoDB | Escalabilidade horizontal, schema flexível | ACID limitado a documento único; floats IEEE 754; sem FKs nativas | Liquidação exige transação multi-coleção não nativa |
| DynamoDB | Alta disponibilidade, pay-per-request | Sem joins transacionais; modelagem complexa para relacionamentos | Domínio altamente relacional |
| Event Sourcing puro | Audit trail imutável por design | Overhead operacional e de modelagem para MVP | `AuditLog` relacional atende requisito atual |
| CockroachDB | Distribuição SQL-native | Complexidade operacional desnecessária para volume atual | PostgreSQL single-node suficiente no MVP |

## Compliance

**Ambiente financeiro**:

- ACID compliance em transações multi-tabela
- Integridade referencial via foreign keys
- Precisão decimal via `NUMERIC` (não float)
- Auditabilidade via `AuditLog` e migrations versionadas
- Testes de integração validando rollback e concorrência

## References

- [ADR-001: Stack Selection](./001-stack-selection.md)
- [PostgreSQL ACID](https://www.postgresql.org/docs/current/transaction-iso.html)
- [PostgreSQL NUMERIC Type](https://www.postgresql.org/docs/current/datatype-numeric.html)
- [Prisma Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)
- `apps/backend/src/business/services/transaction.service.ts`
- `apps/backend/src/tests/integration/transaction.integration.test.ts`

## Sign-off

**Approved by**: Kaique Bernardo  
**Date**: 2026-07-03  
**Review Date**: 2026-10-03 (3 meses)
