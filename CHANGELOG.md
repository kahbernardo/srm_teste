# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Added (03/07/2026)

#### Backend API Completo
- **Pricing Engine** com Strategy Pattern
  - `DuplicataStrategy`: Cálculo padrão mercado financeiro (ano comercial 360 dias)
  - `ChequeStrategy`: Com prêmio de risco adicional (+20%)
  - `PricingStrategyFactory`: Factory para extensibilidade
  
- **Transaction Management**
  - `POST /api/v1/transactions` - Criar transação com cálculo automático de pricing
  - `GET /api/v1/transactions` - Listar com filtros (status, currency, asset type, data)
  - `GET /api/v1/transactions/:id` - Obter por ID
  - `POST /api/v1/transactions/:id/settle` - Liquidar transação
  - Conversão cambial multimoedas
  - Optimistic locking (prevenção de race conditions)

- **Currency Management**
  - `GET /api/v1/currencies` - Listar moedas
  - `GET /api/v1/currencies/:id` - Obter por ID
  - `GET /api/v1/currencies/code/:code` - Obter por código (BRL, USD)

- **Asset Type Management**
  - `GET /api/v1/asset-types` - Listar tipos de ativos
  - `GET /api/v1/asset-types/:id` - Obter por ID
  - `GET /api/v1/asset-types/code/:code` - Obter por código (DUPLICATA, CHEQUE, CCB)

- **Exchange Rate Management**
  - `GET /api/v1/exchange-rates` - Listar taxas de câmbio
  - `GET /api/v1/exchange-rates/current` - Obter taxa atual entre duas moedas
  - `POST /api/v1/exchange-rates` - Criar nova taxa (invalida anterior)

#### Database & Persistence
- **Prisma Schema** completo com 7 modelos:
  - `Currency`, `ExchangeRate`, `AssetType`, `PricingStrategy`, `Transaction`, `AuditLog`
- Precisão decimal (NUMERIC 18,6) para valores financeiros
- Índices otimizados para queries analíticas
- Seed script com dados iniciais (2 moedas, 3 asset types, taxas de câmbio, 2 transações)

#### Infrastructure
- **Fastify** configurado com:
  - Swagger/OpenAPI documentation (`/docs`)
  - CORS, Helmet (security headers)
  - Rate limiting (100 req/min)
  - Structured logging (Pino)
  - Health checks (`/health`, `/health/ready`)
- **Docker Compose** com PostgreSQL 16
- Arquitetura 3-Tier (Presentation, Business, Persistence)

#### Testing
- **13 unit tests** para estratégias de pricing
  - `duplicata-strategy.test.ts` (7 testes)
  - `cheque-strategy.test.ts` (6 testes)
- Cobertura de casos: valores pequenos, grandes, edge cases, precisão decimal
- ✅ 100% de sucesso nos testes

#### Documentation
- `README.md` - Documentação completa do projeto
- `QUICKSTART.md` - Setup em 5 minutos
- `IMPLEMENTATION_STATUS.md` - Status detalhado com roadmap
- `API_EXAMPLES.md` - Exemplos de uso com cURL
- `TESTE_LOCAL.md` - Guia de testes sem Docker
- `CHANGELOG.md` - Este arquivo
- Swagger inline documentation em todos os endpoints

#### Developer Experience
- Scripts npm organizados:
  - `npm run dev:backend` - Backend em modo watch
  - `npm run db:setup` - Migrations + seeds
  - `npm run db:studio` - Prisma Studio (GUI)
  - `npm run test` - Testes unitários
  - `npm run build` - Build TypeScript
- Husky + Commitlint configurados
- ESLint + Prettier

### Technical Details

#### Stack
- **Backend**: Node.js 20+, Fastify 4, TypeScript 5.3
- **Database**: PostgreSQL 16 (Prisma ORM)
- **Validation**: Zod (runtime schema validation)
- **Testing**: Vitest
- **Docs**: Swagger/OpenAPI 3.0

#### Architecture Patterns
- **3-Tier Architecture**: Presentation → Business → Persistence
- **Strategy Pattern**: Pricing strategies plugáveis
- **Factory Pattern**: PricingStrategyFactory
- **Repository Pattern**: Via Prisma Client
- **SOLID Principles**: Separação de responsabilidades

#### Security
- Prepared statements (SQL injection protection)
- Input validation (Zod)
- Rate limiting
- Security headers (Helmet)
- CORS configurado
- Optimistic locking

#### Performance
- Índices de banco otimizados
- Fastify (~20k req/s)
- Connection pooling (Prisma)
- Decimal precision (sem floating-point errors)

### Metrics

- **Arquivos criados**: 30+
- **Linhas de código**: ~2,500
- **Endpoints REST**: 13
- **Modelos Prisma**: 7
- **Testes unitários**: 13 (100% passing)
- **Estratégias de pricing**: 2
- **Páginas de documentação**: 6

### Known Issues

1. **Vulnerabilidades npm**: 22 vulnerabilidades (4 moderate, 15 high, 3 critical)
   - Majoritariamente em devDependencies
   - Action: Rodar `npm audit fix` e testar
   
2. **Next.js deprecated**: Warning de segurança na versão 14.2.0
   - Action: Atualizar para versão patched

3. **Docker daemon**: Erro genérico quando Docker não está rodando
   - Action: Adicionar validação e mensagem clara

### Migration Notes

- **Database**: Primeira migration ainda não aplicada (requer PostgreSQL rodando)
- **Breaking changes**: Nenhum (versão inicial)

### Deprecations

- Nenhum

---

## [0.1.0] - 2026-07-03

### Meta
- Versão inicial de desenvolvimento
- M0: Foundation - 95% completo
- Pronto para testes locais

---

## Roadmap

### [0.2.0] - M1: Core Engine MVP
- [ ] Testes de integração
- [ ] CI/CD básico (GitHub Actions)
- [ ] Migrations aplicadas em staging

### [0.3.0] - M2: API Production-Ready
- [ ] Autenticação JWT
- [ ] Observabilidade (Prometheus)
- [ ] Audit log middleware

### [0.4.0] - M3: Operator Dashboard
- [ ] Frontend Next.js
- [ ] UI components (shadcn/ui)

### [1.0.0] - Production Release
- [ ] Security review completo
- [ ] Performance tests
- [ ] Documentação final
- [ ] Deploy produção

---

[Unreleased]: https://github.com/seu-usuario/srm-credit-engine/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/seu-usuario/srm-credit-engine/releases/tag/v0.1.0
