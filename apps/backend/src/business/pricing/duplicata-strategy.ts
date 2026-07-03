import { Decimal } from '@prisma/client/runtime/library';
import {
  IPricingStrategy,
  PricingInput,
  PricingResult,
} from './pricing-strategy.interface';

export class DuplicataStrategy implements IPricingStrategy {
  getStrategyName(): string {
    return 'DuplicataStrategy';
  }

  calculate(input: PricingInput): PricingResult {
    const { faceValue, daysToMaturity, baseSpread, riskMultiplier } = input;

    // Fórmula: taxa_desconto = (base_spread * risk_multiplier) * (dias / 360)
    // Usamos ano comercial (360 dias) como padrão do mercado financeiro brasileiro
    const annualRate = baseSpread.mul(riskMultiplier);
    const discountRate = annualRate.mul(new Decimal(daysToMaturity)).div(new Decimal(360));

    // Valor do deságio = valor_de_face * taxa_desconto
    const discountAmount = faceValue.mul(discountRate);

    // Valor líquido = valor_de_face - deságio
    const netAmount = faceValue.sub(discountAmount);

    return {
      discountRate,
      discountAmount,
      netAmount,
    };
  }
}
