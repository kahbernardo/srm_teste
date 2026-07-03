# 🔌 Exemplos de Uso da API

Exemplos práticos de como usar a API do SRM Credit Engine.

## 📍 Base URL

```
http://localhost:4000
```

## 🔍 Health Checks

### Liveness Probe

```bash
curl http://localhost:4000/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.456
}
```

### Readiness Probe (com validação de DB)

```bash
curl http://localhost:4000/health/ready
```

**Response:**
```json
{
  "status": "ready",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected"
}
```

---

## 💰 Transações

### 1. Criar Nova Transação (Duplicata em BRL)

```bash
curl -X POST http://localhost:4000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "externalReference": "DUP-2024-12345",
    "assetTypeId": "UUID_DO_ASSET_TYPE_DUPLICATA",
    "currencyId": "UUID_DA_CURRENCY_BRL",
    "faceValue": 100000.00,
    "daysToMaturity": 90,
    "createdBy": "operator@srm.com"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "faceValue": "100000.00",
    "discountRate": "0.003750",
    "discountAmount": "375.00",
    "netAmount": "99625.00",
    "status": "PENDING"
  }
}
```

**Explicação do Cálculo:**
- **Base Spread**: 1.5% ao ano (0.015000)
- **Risk Multiplier**: 1.000 (sem ajuste)
- **Taxa Anual**: 0.015000 × 1.000 = 0.015000
- **Taxa de Desconto**: 0.015000 × (90 / 360) = 0.003750
- **Deságio**: R$ 100.000 × 0.003750 = R$ 375,00
- **Valor Líquido**: R$ 100.000 - R$ 375 = R$ 99.625,00

---

### 2. Criar Transação com Conversão Cambial (BRL → USD)

```bash
curl -X POST http://localhost:4000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "externalReference": "DUP-2024-12346",
    "assetTypeId": "UUID_DO_ASSET_TYPE_DUPLICATA",
    "currencyId": "UUID_DA_CURRENCY_BRL",
    "targetCurrencyId": "UUID_DA_CURRENCY_USD",
    "faceValue": 50000.00,
    "daysToMaturity": 60,
    "createdBy": "operator@srm.com"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "b2c3d4e5-f6g7-8901-bcde-f12345678901",
    "faceValue": "50000.00",
    "discountRate": "0.002500",
    "discountAmount": "125.00",
    "netAmount": "49875.00",
    "exchangeRateApplied": "0.200000",
    "convertedAmount": "9975.00",
    "status": "PENDING"
  }
}
```

**Explicação:**
- Valor líquido em BRL: R$ 49.875,00
- Taxa de câmbio: 1 BRL = 0.20 USD
- Valor convertido: R$ 49.875 × 0.20 = $ 9.975,00

---

### 3. Criar Transação com Cheque (maior risco)

```bash
curl -X POST http://localhost:4000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "externalReference": "CHQ-2024-789",
    "assetTypeId": "UUID_DO_ASSET_TYPE_CHEQUE",
    "currencyId": "UUID_DA_CURRENCY_BRL",
    "faceValue": 30000.00,
    "daysToMaturity": 45,
    "createdBy": "operator@srm.com"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "c3d4e5f6-g7h8-9012-cdef-123456789012",
    "faceValue": "30000.00",
    "discountRate": "0.003750",
    "discountAmount": "112.50",
    "netAmount": "29887.50",
    "status": "PENDING"
  }
}
```

**Explicação (ChequeStrategy):**
- Base Spread: 2.5% ao ano (0.025000)
- Risk Multiplier: 1.200 (estratégia aplica 20% adicional de risco)
- Risk Premium do Cheque: 1.2 (mais 20% - definido na estratégia)
- Taxa Anual Ajustada: 0.025000 × 1.200 × 1.2 = 0.036000
- Taxa de Desconto: 0.036000 × (45 / 360) = 0.004500
- Deságio: R$ 30.000 × 0.004500 = R$ 135,00 *(valor aproximado)*

---

### 4. Listar Todas as Transações

```bash
curl http://localhost:4000/api/v1/transactions
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "externalReference": "DUP-2024-001",
      "faceValue": "100000.00",
      "netAmount": "99625.00",
      "status": "SETTLED",
      "assetType": {
        "code": "DUPLICATA",
        "name": "Duplicata Mercantil"
      },
      "currency": {
        "code": "BRL",
        "symbol": "R$"
      },
      "createdAt": "2024-01-15T09:00:00.000Z"
    },
    // ... mais transações
  ],
  "count": 5
}
```

---

### 5. Listar com Filtros

#### Por Status

```bash
curl "http://localhost:4000/api/v1/transactions?status=PENDING"
```

#### Por Moeda

```bash
curl "http://localhost:4000/api/v1/transactions?currencyId=UUID_DA_CURRENCY_BRL"
```

#### Por Range de Data

```bash
curl "http://localhost:4000/api/v1/transactions?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z"
```

#### Múltiplos Filtros + Limit

```bash
curl "http://localhost:4000/api/v1/transactions?status=SETTLED&currencyId=UUID_BRL&limit=10"
```

---

### 6. Obter Transação por ID

```bash
curl http://localhost:4000/api/v1/transactions/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "externalReference": "DUP-2024-12345",
    "faceValue": "100000.00",
    "daysToMaturity": 90,
    "discountRate": "0.003750",
    "discountAmount": "375.00",
    "netAmount": "99625.00",
    "status": "PENDING",
    "assetType": {
      "id": "...",
      "code": "DUPLICATA",
      "name": "Duplicata Mercantil"
    },
    "currency": {
      "id": "...",
      "code": "BRL",
      "name": "Brazilian Real",
      "symbol": "R$"
    },
    "createdBy": "operator@srm.com",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "version": 1
  }
}
```

---

### 7. Liquidar Transação

```bash
curl -X POST http://localhost:4000/api/v1/transactions/a1b2c3d4-e5f6-7890-abcd-ef1234567890/settle
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "SETTLED",
    "settledAt": "2024-01-15T11:00:00.000Z",
    "version": 2
  }
}
```

**⚠️ Nota**: 
- Só é possível liquidar transações com `status: PENDING`
- Optimistic locking impede race conditions (campo `version`)

---

## ❌ Tratamento de Erros

### Validação de Input (400 Bad Request)

```bash
curl -X POST http://localhost:4000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "faceValue": -1000,
    "daysToMaturity": "invalid"
  }'
```

**Response:**
```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["assetTypeId"],
      "message": "Required"
    },
    {
      "code": "too_small",
      "minimum": 0.01,
      "path": ["faceValue"],
      "message": "Number must be greater than 0.01"
    }
  ]
}
```

---

### Recurso Não Encontrado (404 Not Found)

```bash
curl http://localhost:4000/api/v1/transactions/00000000-0000-0000-0000-000000000000
```

**Response:**
```json
{
  "success": false,
  "error": "Transaction not found"
}
```

---

### Erro de Negócio (500 Internal Server Error)

```bash
# Tentar liquidar transação já liquidada
curl -X POST http://localhost:4000/api/v1/transactions/SETTLED_ID/settle
```

**Response:**
```json
{
  "success": false,
  "error": "Transaction cannot be settled. Current status: SETTLED"
}
```

---

## 🔧 Obtendo UUIDs Reais

Para testar com UUIDs reais, você pode:

### 1. Via Prisma Studio (Recomendado)

```bash
npm run db:studio
```

Acesse http://localhost:5555 e copie os IDs das tabelas `currencies` e `asset_types`.

### 2. Via SQL (direto no banco)

```bash
# Conecte no container
docker exec -it srm-postgres psql -U srm_user -d srm_credit_engine

# Liste moedas
SELECT id, code, symbol FROM currencies;

# Liste tipos de ativos
SELECT id, code, name FROM asset_types;
```

### 3. Via API (quando endpoints estiverem prontos)

```bash
curl http://localhost:4000/api/v1/currencies
curl http://localhost:4000/api/v1/asset-types
```

---

## 🧪 Collection do Postman/Insomnia

Importe esta collection para testar rapidamente:

```json
{
  "name": "SRM Credit Engine",
  "requests": [
    {
      "name": "Health Check",
      "method": "GET",
      "url": "http://localhost:4000/health"
    },
    {
      "name": "Create Transaction",
      "method": "POST",
      "url": "http://localhost:4000/api/v1/transactions",
      "body": {
        "externalReference": "TEST-{{$timestamp}}",
        "assetTypeId": "{{ASSET_TYPE_ID}}",
        "currencyId": "{{CURRENCY_ID}}",
        "faceValue": 100000,
        "daysToMaturity": 90,
        "createdBy": "test@srm.com"
      }
    },
    {
      "name": "List Transactions",
      "method": "GET",
      "url": "http://localhost:4000/api/v1/transactions"
    }
  ]
}
```

---

## 📚 Swagger UI

A maneira mais fácil de explorar e testar a API é via Swagger:

👉 **http://localhost:4000/docs**

- Interface interativa
- Validação automática
- Try-it-out para testar endpoints
- Schemas de request/response documentados

---

**Dúvidas?** Consulte o [README.md](./README.md) ou abra uma issue.
