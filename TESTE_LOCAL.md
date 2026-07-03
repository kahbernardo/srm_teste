# 🧪 Guia de Teste Local - SRM Credit Engine

Como testar a aplicação localmente **SEM Docker**.

## ⚡ Opção 1: PostgreSQL Local (Recomendado)

Se você já tem PostgreSQL instalado localmente:

### 1. Criar Database

```bash
# Conecte como superuser
psql postgres

# No psql:
CREATE USER srm_user WITH PASSWORD 'srm_password';
CREATE DATABASE srm_credit_engine OWNER srm_user;
GRANT ALL PRIVILEGES ON DATABASE srm_credit_engine TO srm_user;
\q
```

### 2. Configurar .env

O arquivo `.env` já está configurado para PostgreSQL local:

```bash
cd apps/backend
cat .env

# Deve conter:
# DATABASE_URL="postgresql://srm_user:srm_password@localhost:5432/srm_credit_engine?schema=public"
```

### 3. Rodar Migrations e Seeds

```bash
# Na raiz do projeto
npm run db:setup

# Ou manualmente:
cd apps/backend
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Iniciar Backend

```bash
# Na raiz
npm run dev:backend

# Ou
cd apps/backend
npm run dev
```

### 5. Testar

Abra seu navegador em:
- **Swagger UI**: http://localhost:4000/docs
- **Health Check**: http://localhost:4000/health

---

## 🐳 Opção 2: Docker (Sem PostgreSQL Local)

Se você **não** tem PostgreSQL instalado mas tem Docker:

### 1. Iniciar Docker Desktop

Certifique-se que o Docker Desktop está rodando (ícone na barra de tarefas).

### 2. Subir Apenas PostgreSQL

```bash
# Na raiz do projeto
npm run docker:up

# Aguardar healthcheck (10-20 segundos)
docker ps | grep srm-postgres
```

### 3. Rodar Setup

```bash
npm run db:setup
```

### 4. Iniciar Backend

```bash
npm run dev:backend
```

---

## ✅ Validando a Instalação

### 1. Health Checks

```bash
# Liveness
curl http://localhost:4000/health

# Readiness (valida conexão com DB)
curl http://localhost:4000/health/ready
```

**Resposta esperada:**
```json
{
  "status": "ready",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected"
}
```

### 2. Listar Moedas (Seeds)

```bash
curl http://localhost:4000/api/v1/currencies
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "code": "BRL",
      "name": "Brazilian Real",
      "symbol": "R$",
      "active": true
    },
    {
      "id": "...",
      "code": "USD",
      "name": "US Dollar",
      "symbol": "$",
      "active": true
    }
  ],
  "count": 2
}
```

### 3. Listar Tipos de Ativos

```bash
curl http://localhost:4000/api/v1/asset-types
```

**Resposta esperada:** 3 ativos (DUPLICATA, CHEQUE, CCB)

### 4. Listar Transações (Seeds)

```bash
curl http://localhost:4000/api/v1/transactions
```

**Resposta esperada:** 2 transações de exemplo

---

## 🧪 Testando Criação de Transação

### 1. Obter IDs das Currencies e Asset Types

Via Swagger UI (http://localhost:4000/docs):
1. Expanda `GET /api/v1/currencies`
2. Clique "Try it out" → "Execute"
3. Copie o `id` da moeda BRL
4. Faça o mesmo para `GET /api/v1/asset-types` e copie o ID de DUPLICATA

### 2. Criar Transação

Via Swagger UI:
1. Expanda `POST /api/v1/transactions`
2. Clique "Try it out"
3. Cole este JSON (substituindo os UUIDs):

```json
{
  "externalReference": "TEST-001",
  "assetTypeId": "UUID_DO_ASSET_TYPE_DUPLICATA",
  "currencyId": "UUID_DA_CURRENCY_BRL",
  "faceValue": 100000,
  "daysToMaturity": 90,
  "createdBy": "test@srm.com"
}
```

4. Clique "Execute"

**Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "id": "novo-uuid",
    "faceValue": "100000",
    "discountRate": "0.003750",
    "discountAmount": "375.00",
    "netAmount": "99625.00",
    "status": "PENDING"
  }
}
```

### 3. Liquidar Transação

```bash
curl -X POST http://localhost:4000/api/v1/transactions/TRANSACTION_ID/settle
```

---

## 📊 Prisma Studio (Visualização do Banco)

Para explorar os dados visualmente:

```bash
npm run db:studio
```

Acesse: http://localhost:5555

---

## 🧪 Rodando Testes Unitários

```bash
# Na raiz
npm run test

# Com coverage
npm run test:coverage

# No backend apenas
cd apps/backend
npm run test:watch  # modo watch
```

**Resultado esperado:**
```
✓ src/business/pricing/cheque-strategy.test.ts  (6 tests)
✓ src/business/pricing/duplicata-strategy.test.ts  (7 tests)

Test Files  2 passed (2)
     Tests  13 passed (13)
```

---

## 🐛 Troubleshooting

### "Connection refused" ao acessar API

```bash
# Verifique se o backend está rodando
lsof -i :4000

# Se não estiver, inicie:
npm run dev:backend
```

### "Database not found" nas migrations

```bash
# Verifique conexão com o banco
psql -U srm_user -d srm_credit_engine -c "SELECT 1"

# Se falhar, recrie o database (veja Opção 1, passo 1)
```

### "Port 5432 already in use"

Você tem PostgreSQL rodando localmente. Escolha:

**A) Usar o PostgreSQL local** (Opção 1 acima)

**B) Parar o local e usar Docker:**
```bash
# macOS
brew services stop postgresql

# Linux
sudo systemctl stop postgresql

# Depois
npm run docker:up
```

### "Cannot find module @prisma/client"

```bash
cd apps/backend
npx prisma generate
```

### Erros de tipo Decimal em testes

Se você estiver usando SQLite ou outro DB que não suporta DECIMAL, os cálculos podem ter pequenas diferenças de precisão. Use PostgreSQL para testes precisos.

---

## 📝 Checklist de Teste Completo

- [ ] Health checks retornam 200 OK
- [ ] `/currencies` retorna BRL e USD
- [ ] `/asset-types` retorna DUPLICATA, CHEQUE, CCB
- [ ] `/transactions` retorna 2 seeds
- [ ] Criar nova transação via POST
- [ ] Liquidar transação via POST /settle
- [ ] Prisma Studio abre e mostra dados
- [ ] Testes unitários passam (13/13)
- [ ] Build TypeScript passa sem erros

---

## 🎯 Próximos Testes

Após validar tudo acima:

1. **Testar conversão cambial**: Criar transação com `targetCurrencyId`
2. **Testar filtros**: Listar transações por status, currency, data
3. **Testar estratégias**: Criar transação com CHEQUE (spread maior)
4. **Stress test**: Criar 100 transações via script

---

**Dúvidas?** Consulte:
- [README.md](./README.md) - Documentação completa
- [API_EXAMPLES.md](./API_EXAMPLES.md) - Exemplos de cURL
- [QUICKSTART.md](./QUICKSTART.md) - Setup rápido
