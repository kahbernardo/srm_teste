# ADR-004: Pricing Strategy Pattern

**Status**: Accepted  
**Date**: 2026-07-03  
**Deciders**: kahbernardo  
**Tags**: #architecture #pricing #design-patterns

## Context

O SRM Credit Engine precisa calcular deságio para diferentes tipos de recebíveis (Duplicata, Cheque, CCB), cada um com regras de risco e spread distintos. Novos tipos de ativos serão adicionados ao longo do tempo sem alterar o core de liquidação.

Forças em jogo:

1. **Extensibilidade**: adicionar novos tipos sem modificar `TransactionService`
2. **Testabilidade**: testar cada regra de precificação isoladamente
3. **Open/Closed Principle**: aberto para extensão, fechado para modificação
4. **Precisão**: cálculos com `Decimal` para evitar erros de ponto flutuante

## Decision

Adotar o **Strategy Pattern** com **Factory** para o motor de precificação:

- Interface `IPricingStrategy` define o contrato de cálculo
- Implementações: `DuplicataStrategy`, `ChequeStrategy`
- `PricingStrategyFactory` resolve a estratégia pelo `strategyName` configurado no banco
- Configuração de spreads em `pricing_strategies` (baseSpread, riskMultiplier, validFrom)

Fórmula base (ano comercial 360 dias):

```
taxa_desconto = (base_spread * risk_multiplier) * (dias / 360)
deságio = valor_face * taxa_desconto
valor_líquido = valor_face - deságio
```

## Consequences

### Positivas

- Novos tipos de ativo: criar classe + registrar na Factory
- Testes unitários por estratégia (13 testes cobrindo Duplicata e Cheque)
- Spreads configuráveis via banco sem redeploy

### Negativas

- Indireção adicional (Factory lookup)
- Risco de estratégia não registrada na Factory (mitigado: erro explícito em runtime)

### Mitigações

- Seed com estratégias padrão
- Testes de integração validam fluxo end-to-end
- ADR documenta contrato para novos tipos

## Alternatives Considered

| Alternativa | Por que rejeitada |
|-------------|-------------------|
| if/else por `assetType.code` | Viola OCP; cresce linearmente com novos tipos |
| Rules Engine externo (Drools) | Over-engineering para MVP; curva de aprendizado |
| Template Method | Menos flexível que Strategy para variações de fórmula |

## References

- [DuplicataStrategy](../../apps/backend/src/business/pricing/duplicata-strategy.ts)
- [ChequeStrategy](../../apps/backend/src/business/pricing/cheque-strategy.ts)
- [PricingStrategyFactory](../../apps/backend/src/business/pricing/pricing-strategy-factory.ts)

## Sign-off

Aprovado em 2026-07-03. Revisão recomendada ao adicionar CCB ou novos tipos de recebível.
