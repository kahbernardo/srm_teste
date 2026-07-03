# 🚀 Quick Start Guide

Guia rápido para rodar o projeto SRM Credit Engine localmente.

## 📋 Pré-requisitos

Certifique-se de ter instalado:

- **Node.js** >= 20.11.0 ([Download](https://nodejs.org/))
- **Docker** >= 24.0 ([Download](https://www.docker.com/get-started))
- **Docker Compose** >= 2.20

Verifique as versões:

```bash
node -v   # deve retornar >= v20.11.0
npm -v    # deve retornar >= 10.0.0
docker -v # deve retornar >= 24.0
```

## 🛠️ Setup Inicial

### 1. Clone e Instale Dependências

```bash
# Clone o repositório (se ainda não fez)
git clone https://github.com/seu-usuario/srm-credit-engine.git
cd srm-credit-engine

# Instale todas as dependências (monorepo)
npm install
```

### 2. Suba o Banco de Dados

```bash
# Inicie o PostgreSQL via Docker
npm run docker:up

# Aguarde o banco estar pronto (healthcheck)
# Você pode ver os logs com:
npm run docker:logs
```

### 3. Configure Variáveis de Ambiente

O arquivo `.env` já foi criado no backend com valores padrão. Se precisar ajustar:

```bash
# Backend
cd apps/backend
cat .env  # Verifique as configurações

# Valores padrão:
# DATABASE_URL="postgresql://srm_user:srm_password@localhost:5432/srm_credit_engine?schema=public"
# PORT=4000
# NODE_ENV=development
```

### 4. Execute Migrations e Seeds

```bash
# Volte para a raiz do projeto
cd ../..

# Rode migrations e seeds em um comando
npm run db:setup
```

Este comando irá:
- Criar as tabelas no banco (migrations)
- Popular com dados iniciais (seeds):
  - 2 moedas (BRL, USD)
  - Taxas de câmbio
  - 3 tipos de ativos (Duplicata, Cheque, CCB)
  - Estratégias de precificação
  - 2 transações de exemplo

### 5. Inicie o Backend

```bash
# Em um terminal, inicie o backend
npm run dev:backend
```

Você deve ver:
```
🚀 Server ready at http://0.0.0.0:4000
```

Acesse:
- **API**: http://localhost:4000
- **Swagger Docs**: http://localhost:4000/docs
- **Health Check**: http://localhost:4000/health

## 🧪 Testando a API

### Via Swagger UI (Recomendado)

1. Abra http://localhost:4000/docs
2. Expanda `POST /api/v1/transactions`
3. Clique em "Try it out"
4. Use este payload de exemplo:

```json
{
  "assetTypeId": "<pegar do seed ou do /asset-types>",
  "currencyId": "<pegar do seed ou do /currencies>",
  "faceValue": 100000,
  "daysToMaturity": 90,
  "createdBy": "operator@srm.com"
}
```

### Via cURL

```bash
# Listar transações existentes (seeds)
curl http://localhost:4000/api/v1/transactions

# Criar nova transação (substitua os IDs)
curl -X POST http://localhost:4000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "assetTypeId": "UUID_DO_ASSET_TYPE",
    "currencyId": "UUID_DA_CURRENCY",
    "faceValue": 50000,
    "daysToMaturity": 60,
    "createdBy": "operator@srm.com"
  }'
```

## 🎨 Visualizar Banco de Dados

Para explorar o banco de dados visualmente:

```bash
npm run db:studio
```

Isso abrirá o Prisma Studio em http://localhost:5555

## 📊 Estrutura de Endpoints

Todos os endpoints estão sob `/api/v1`:

| Método | Endpoint                              | Descrição                    |
|--------|---------------------------------------|------------------------------|
| GET    | `/health`                             | Health check                 |
| GET    | `/health/ready`                       | Readiness check (DB)         |
| GET    | `/docs`                               | Swagger documentation        |
| POST   | `/api/v1/transactions`                | Criar transação              |
| GET    | `/api/v1/transactions`                | Listar transações            |
| GET    | `/api/v1/transactions/:id`            | Obter transação              |
| POST   | `/api/v1/transactions/:id/settle`     | Liquidar transação           |

## 🔍 Troubleshooting

### Erro: "Connection refused" ao conectar no DB

```bash
# Verifique se o container está rodando
docker ps | grep srm-postgres

# Se não estiver, suba novamente
npm run docker:up

# Veja os logs do postgres
docker logs srm-postgres
```

### Erro: "Schema does not exist"

```bash
# Execute as migrations novamente
cd apps/backend
npx prisma migrate deploy
```

### Erro: "Cannot find module '@prisma/client'"

```bash
# Gere o Prisma Client
cd apps/backend
npx prisma generate
```

### Porta 5432 já em uso

Se você já tem PostgreSQL rodando localmente:

1. Pare o serviço local: `brew services stop postgresql` (macOS)
2. Ou mude a porta no `docker-compose.yml`: `5433:5432`
3. E atualize o `.env`: `DATABASE_URL=...@localhost:5433/...`

## 🧹 Comandos Úteis

```bash
# Parar todos os containers
npm run docker:down

# Limpar banco e re-executar seeds
cd apps/backend
npm run migrate:reset  # ⚠️ CUIDADO: apaga todos os dados!
npm run db:seed

# Formatar código
npm run format

# Rodar testes
npm run test

# Limpar node_modules e rebuildar
npm run clean
npm install
```

## 📚 Próximos Passos

- [ ] Implementar autenticação (JWT)
- [ ] Adicionar mais endpoints (currencies, asset-types)
- [ ] Criar dashboard frontend (Next.js)
- [ ] Implementar testes unitários e de integração
- [ ] Configurar CI/CD

Ver [README.md](./README.md) para documentação completa.

---

**Dúvidas?** Abra uma issue no GitHub ou consulte a [documentação completa](./docs/).
