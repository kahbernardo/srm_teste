# ADR-005: Event Sourcing vs CRUD

**Status**: Accepted  
**Date**: 2026-07-03  
**Tags**: #architecture #events #audit

## Context

Transações financeiras exigem trilha de auditoria completa. O modelo CRUD com `audit_logs` cobre alterações, mas não captura a sequência temporal de eventos de negócio.

## Decision

Adotar **Event Sourcing híbrido**:

- Tabela `domain_events` armazena eventos de domínio (`TransactionCreated`, `TransactionPriced`, `TransactionSettled`, `ExchangeRateUpdated`)
- Estado atual permanece em tabelas CRUD (`transactions`) para queries OLTP
- Eventos são append-only; reconstrução de estado via replay é possível

## Consequences

- Auditoria completa e imutável
- Base para projeções analíticas futuras
- Duplicação controlada (estado + eventos)

## References

- [eventStore.ts](../../apps/backend/src/events/eventStore.ts)
- [domainEventTypes.ts](../../apps/backend/src/events/domainEventTypes.ts)
