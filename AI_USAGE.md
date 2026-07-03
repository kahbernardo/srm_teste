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
| Linear MCP | Consulta e fechamento de issues |
| PlantUML (via Docker) | Geração de diagramas C4 a partir de `.puml` |

## 3. Princípios de uso

1. **Planejar antes de implementar** — modo Plan para mapear gaps reais na codebase antes de codar
2. **Validar com testes reais** — os 15 testes de integração só passaram com Docker + PostgreSQL ativos
3. **Revisar diff antes de commit** — especialmente em código financeiro (NUMERIC, ACID)
4. **ADRs para decisões humanas** — a IA propõe, o desenvolvedor decide e documenta o porquê
5. **Não confiar em "implementação completa"** nas descrições de issues sem validação runtime

## 4. Prompts estratégicos

Padrões de prompt que funcionaram neste projeto:

| Padrão | Exemplo | Resultado |
|--------|---------|-----------|
| Consulta Linear | "o que está em progress no projeto SRM?" | Visibilidade de backlog sem abrir a UI |
| Plan-then-implement | "planeja DUP-135 com base na codebase" | Plano com gaps reais (Prisma dual schema, DI) |
| Execução com validação | "roda os testes e analisa o resultado" | Bloqueio Docker detectado antes de marcar Done |
| Escopo fechado | "commita depois pode encerrar a DUP-135" | Commit + Linear em um fluxo |
| Escolha de abordagem | Testcontainers vs pg-mem (pergunta estruturada) | Decisão alinhada ao critério do Linear |

### Fluxo recomendado para futuras issues

```
1. Consultar Linear / codebase
2. Pedir plano (Plan mode)
3. Revisar plano
4. Implementar (Agent mode)
5. Rodar testes
6. Commit + fechar issue no Linear
```

## 5. Onde a IA agregou valor

Entregas concretas aceleradas por IA neste repositório:

| Área | Entregas | Issues |
|------|----------|--------|
| Backend core | TransactionService, strategies, controllers, Swagger | DUP-114–131 |
| Testes | 13 unit + 15 integração (Testcontainers) | DUP-134, DUP-135 |
| ADRs | Stack, SQL vs NoSQL, Monólito | DUP-137, DUP-138 |
| Diagramas C4 | `.puml` + PNG (Context e Container) | DUP-136 |
| Documentação | IMPLEMENTATION_STATUS, KNOWN_ISSUES, QUICKSTART | — |

Estimativa qualitativa: tarefas de documentação e boilerplate foram ~60–70% mais rápidas. Lógica de domínio financeiro exigiu revisão manual em todos os casos.

## 6. Casos de alucinação e correções

Casos reais encontrados durante o desenvolvimento:

| Caso | O que a IA assumiu errado | Correção aplicada |
|------|---------------------------|-------------------|
| Integration tests `version` | Esperava `version=0` no optimistic locking | Schema usa `@default(1)` — expectativas ajustadas para 1→2 |
| ExchangeRate seed | Omitiu campo `source` obrigatório | Adicionado `source: 'MANUAL'` no seed de testes |
| Prisma client em testes | Usava client SQLite contra PostgreSQL do Testcontainers | Client postgres dedicado + injeção de dependência no TransactionService |
| Setup de testes | Duas abordagens paralelas (pg-mem + Testcontainers) | Descartado pg-mem; mantido Testcontainers conforme Linear |
| Numeração de ADRs | Linear pedia `001-sql-vs-nosql`, mas `001` já era stack selection | Renumerado para 002/003, alinhado com README |
| Paths dos diagramas C4 | Linear pedia `/docs/c4-*.png`, README usava `docs/diagrams/` | Adotado `docs/diagrams/` (convenção do README) |
| Issue "em progress" | Nenhuma issue marcada In Progress no Linear | Mapeado para DUP-135 pelo estado real do workspace |
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
- **ROI positivo** no contexto de projeto solo (7 semanas, 67 issues), desde que o humano valide testes e arquitetura
- O maior risco não é código errado — é **marcar issue como Done sem validação runtime**

## 8. Limitações e responsabilidades

- A IA pode sugerir marcar critérios de aceite como completos antes de rodar testes
- Código financeiro (NUMERIC, transações ACID) exige testes de integração com banco real
- Decisões de stack e arquitetura são humanas; ADRs registram o raciocínio
- **Autor final:** Kaique Bernardo
- **Co-autor IA:** Claude Sonnet 4.5 (documentado no README)

---

**Última atualização:** 2026-07-03
