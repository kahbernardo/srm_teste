import { Decimal } from '@prisma/client/runtime/library';

export interface PricingInput {
  faceValue: Decimal;
  daysToMaturity: number;
  baseSpread: Decimal;
  riskMultiplier: Decimal;
}

export interface PricingResult {
  discountRate: Decimal;
  discountAmount: Decimal;
  netAmount: Decimal;
}

export interface IPricingStrategy {
  calculate(input: PricingInput): PricingResult;
  getStrategyName(): string;
}
