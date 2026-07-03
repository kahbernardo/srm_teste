# ADR-006: Microservices vs Modular Monolith

**Status**: Accepted  
**Date**: 2026-07-03  
**Tags**: #architecture #scale

## Context

O desafio técnico permite arquitetura distribuída, mas o time e o escopo atual são limitados.

## Decision

Manter **Modular Monolith** com bounded contexts internos:

- `pricing/` — motor de precificação
- `currency/` — câmbio
- `settlement/` — liquidação
- `events/` — event store

Extração para microserviços apenas quando métricas indicarem necessidade (ver [high-scale-architecture.md](../architecture/highScaleArchitecture.md)).

## Consequences

- Deploy simples, transações ACID locais
- Menor overhead operacional
- Caminho de evolução documentado para EDA
