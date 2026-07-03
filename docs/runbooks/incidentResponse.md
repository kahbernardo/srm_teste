# Runbook: Incident Response

## Sintomas: API retorna 503 em /health/ready

### Diagnóstico

1. Verificar PostgreSQL: `docker ps | grep postgres`
2. Testar conexão: `npm run db:studio -w apps/backend`
3. Checar logs: `npm run docker:logs`

### Resolução

```bash
npm run docker:up
npm run db:setup -w apps/backend
npm run dev:backend
```

### Escalação

Se persistir após 15 minutos, acionar DBA e revisar `DATABASE_URL`.

---

## Sintomas: Circuit breaker OPEN em câmbio

### Diagnóstico

1. Verificar taxas: `GET /api/v1/exchange-rates`
2. Checar métrica `srm_exchange_rate_age_seconds` no Prometheus

### Resolução

1. Inserir nova taxa via API ou seed
2. Aguardar 30s (reset timeout do circuit breaker)
3. Retry da operação

---

## Sintomas: Race condition em liquidação

### Diagnóstico

- Erro `Transaction cannot be settled` ou conflito de `version`
- Optimistic locking detectou concorrência

### Resolução

1. Recarregar transação: `GET /api/v1/transactions/:id`
2. Retry settle se status ainda `PENDING`
3. Se `SETTLED`, operação já concluída (idempotência)
