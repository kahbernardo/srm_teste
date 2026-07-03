# 🐛 Known Issues - SRM Credit Engine

## Issue #1: Empty Response on Single Transaction Endpoints

**Status**: ✅ RESOLVED (2026-07-03)  
**Severity**: Medium  
**Affected Endpoints** (corrigidos):
- `GET /api/v1/transactions/:id`
- `POST /api/v1/transactions`
- `POST /api/v1/transactions/:id/settle`
- `POST /api/v1/transactions/simulate`

### Root Cause

Dois fatores combinados:

1. Objetos `Decimal` do Prisma não serializavam corretamente no JSON de resposta
2. Schemas de resposta Fastify com `data: { type: 'object' }` sem propriedades — o serializer removia todos os campos

### Fix Applied

- Helper `serializeForResponse` em [`responseSerializer.ts`](../apps/backend/src/presentation/utils/responseSerializer.ts)
- Uso no [`transaction.controller.final.ts`](../apps/backend/src/presentation/controllers/transaction.controller.final.ts)
- Remoção dos response schemas restritivos em settle/get

### Previous Workarounds (obsoletos)
```bash
# Instead of GET /transactions/:id
# Use GET /transactions and filter by ID on client
curl 'http://localhost:4000/api/v1/transactions' | jq '.data[] | select(.id == "...")'
```

**Option B**: Use debug endpoints (temporary)
```bash
curl 'http://localhost:4000/debug-get/:id'  # Full response
```

**Option C**: Check operation success via list
```bash
# 1. POST transaction (ignore empty response)
curl -X POST .../transactions -d '{...}'

# 2. Verify via list
curl '.../transactions' | jq '.data[0]'  # Latest transaction
```

### Histórico de investigação

Abordagens testadas antes do fix definitivo:

1. Decimal serialization helper isolado — insuficiente sem remover response schema
2. Remoção de response schemas restritivos — necessário
3. `serializeForResponse` recursivo — solução final

### Referências (obsoletas)

- [Fastify Serialization Docs](https://fastify.dev/docs/latest/Reference/Serialization/)
- [Prisma JSON Serialization](https://www.prisma.io/docs/orm/prisma-client/queries/custom-validation)

---

**Last Updated**: 2026-07-03  
**Status**: Resolvido
