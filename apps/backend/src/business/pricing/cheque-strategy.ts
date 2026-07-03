import { Decimal } from '@prisma/client/runtime/library';
import {
  IPricingStrategy,
  PricingInput,
  PricingResult,
} from './pricing-strategy.interface';

export class ChequeStrategy implements IPricingStrategy {
  getStrategyName(): string {
    return 'ChequeStrategy';
  }

  calculate(input: PricingInput): PricingResult {
    const { faceValue, daysToMaturity, baseSpread, riskMultiplier } = input;

    // Cheques têm maior risco (devolução, falta de fundos)
    // Aplicamos um multiplicador adicional de risco
    const CHEQUE_RISK_PREMIUM = new Decimal(1.2); // 20% adicional
    const adjustedRiskMultiplier = riskMultiplier.mul(CHEQUE_RISK_PREMIUM);

    // Fórmula: taxa_desconto = (base_spread * adjusted_risk) * (dias / 360)
    const annualRate = baseSpread.mul(adjustedRiskMultiplier);
    const discountRate = annualRate.mul(new Decimal(daysToMaturity)).div(new Decimal(360));

    const discountAmount = faceValue.mul(discountRate);
    const netAmount = faceValue.sub(discountAmount);

    return {
      discountRate,
      discountAmount,
      netAmount,
    };
  }
}
