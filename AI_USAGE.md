# AI Usage - SRM Credit Engine

Documentação de como Large Language Models (LLMs) foram utilizados no desenvolvimento deste projeto.

## 1. Visão geral

O SRM Credit Engine foi desenvolvido com auxílio de **Claude Sonnet 4.5** via **Cursor Agent**. A IA atuou como co-pilot para acelerar boilerplate, documentação, testes e exploração da codebase.

Todo código gerado passou por revisão humana antes de commit. Decisões arquiteturais estão registradas nos [ADRs](./docs/adr/README.md).

**Princípio:** IA como co-pilot, não como autopilot.

## 2. Ferramentas e modelos

| Ferramenta | Uso |
|------------|-----|
| Cursor Agent (Claude Sonnet 4.5) | Implementação, planos, testes, ADRs, diagramas |
| Cursor Plan mode | Planejamento antes de implementação |
| PlantUML (via Docker) | Geração de diagramas C4 a partir de `.puml` |

## 3. Princípios de uso

1. **Planejar antes de implementar** — modo Plan para mapear gaps reais na codebase antes de codar
2. **Validar com testes reais** — os testes de integração só passaram com Docker + PostgreSQL ativos
3. **Revisar diff antes de commit** — especialmente em código financeiro (NUMERIC, ACID)
4. **ADRs para decisões humanas** — a IA propõe, o desenvolvedor decide e documenta o porquê
5. **Não confiar em "implementação completa"** sem validação runtime

## 4. Prompts estratégicos

Padrões de prompt que funcionaram neste projeto:

| Padrão | Exemplo | Resultado |
|--------|---------|-----------|
| Plan-then-implement | "planeja testes de integração com base na codebase" | Plano com gaps reais (Prisma dual schema, DI) |
| Execução com validação | "roda os testes e analisa o resultado" | Bloqueio Docker detectado antes de marcar como concluído |
| Escopo fechado | "implementa e commita" | Entrega atômica com revisão humana |
| Escolha de abordagem | Testcontainers vs pg-mem (pergunta estruturada) | Decisão alinhada ao critério do desafio |

### Fluxo recomendado

```
1. Explorar codebase
2. Pedir plano (Plan mode)
3. Revisar plano
4. Implementar (Agent mode)
5. Rodar testes
6. Commit com conventional commits
```

## 5. Onde a IA agregou valor

Entregas concretas aceleradas por IA neste repositório:

| Área | Entregas |
|------|----------|
| Backend core | TransactionService, strategies, controllers, Swagger |
| Testes | Unitários + integração (Testcontainers) |
| ADRs | Stack, SQL vs NoSQL, Monólito, Event Sourcing |
| Diagramas C4 | `.puml` + PNG (Context e Container) |
| Documentação | IMPLEMENTATION_STATUS, KNOWN_ISSUES, QUICKSTART |

Estimativa qualitativa: tarefas de documentação e boilerplate foram ~60–70% mais rápidas. Lógica de domínio financeiro exigiu revisão manual em todos os casos.

## 6. Casos de alucinação e correções

Casos reais encontrados durante o desenvolvimento:

| Caso | O que a IA assumiu errado | Correção aplicada |
|------|---------------------------|-------------------|
| Integration tests `version` | Esperava `version=0` no optimistic locking | Schema usa `@default(1)` — expectativas ajustadas para 1→2 |
| ExchangeRate seed | Omitiu campo `source` obrigatório | Adicionado `source: 'MANUAL'` no seed de testes |
| Prisma client em testes | Usava client SQLite contra PostgreSQL do Testcontainers | Client postgres dedicado + injeção de dependência no TransactionService |
| Setup de testes | Duas abordagens paralelas (pg-mem + Testcontainers) | Descartado pg-mem; mantido Testcontainers |
| Numeração de ADRs | Sugestão de renumerar conflitando com ADR-001 existente | Renumerado para 002/003, alinhado com README |
| Paths dos diagramas C4 | Sugestão de path diferente do README | Adotado `docs/diagrams/` (convenção do README) |
| Serialização Fastify | Múltiplas tentativas de fix para `data: {}` em endpoints | Não resolvido — documentado em [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) |

O caso da serialização Fastify (Issue #1 em KNOWN_ISSUES.md) é exemplo onde a IA **não** resolveu o problema sozinha, apesar de várias abordagens testadas.

## 7. Análise crítica de economia de tempo

| Atividade | Sem IA (estimativa) | Com IA | Ganho líquido |
|-----------|---------------------|--------|---------------|
| ADRs (3 documentos) | ~1.5 dia | ~2h | Alto |
| Infra de testes de integração | ~2 dias | ~4h + debug Docker | Médio-alto |
| Diagramas C4 | ~1 dia | ~1h | Alto |
| Pricing engine / API REST | ~3 dias | ~1.5 dia | Médio (revisão obrigatória) |
| Debug serialização Fastify | Indefinido | Ainda aberto | Negativo / neutro |

### Conclusão

- **IA excelente** para artefatos repetitivos: documentação, scaffolding, testes, diagramas
- **IA fraca** em bugs de framework/runtime sem ambiente de reprodução local (Docker desligado, serialização Fastify)
- **ROI positivo** no contexto de projeto solo, desde que o humano valide testes e arquitetura
- O maior risco não é código errado — é **marcar entrega como concluída sem validação runtime**

## 8. Limitações e responsabilidades

- A IA pode sugerir marcar critérios de aceite como completos antes de rodar testes
- Código financeiro (NUMERIC, transações ACID) exige testes de integração com banco real
- Decisões de stack e arquitetura são humanas; ADRs registram o raciocínio
- **Autor final:** kahbernardo
- **Co-autor IA:** Claude Sonnet 4.5 (documentado no README)

---

**Última atualização:** 2026-07-03
