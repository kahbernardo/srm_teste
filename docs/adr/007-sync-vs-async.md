# ADR-007: Synchronous vs Asynchronous Processing

**Status**: Accepted  
**Date**: 2026-07-03  
**Tags**: #architecture #async

## Context

Liquidação requer resposta imediata ao operador, mas eventos de domínio e projeções analíticas podem ser assíncronos.

## Decision

- **Síncrono**: criação e liquidação de transações (API REST)
- **Assíncrono (futuro)**: projeções a partir de `domain_events`, notificações, relatórios pesados

Eventos são persistidos de forma síncrona na mesma request; consumidores assíncronos serão adicionados com message broker (Kafka) em escala.

## Consequences

- UX responsiva para operadores
- Event store pronto para workers futuros
- Sem complexidade de sagas distribuídas no MVP
