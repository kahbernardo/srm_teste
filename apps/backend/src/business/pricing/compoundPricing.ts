import { Decimal } from '@prisma/client/runtime/library';
import { PricingInput, PricingResult } from './pricing-strategy.interface';

const DAYS_PER_MONTH = new Decimal(30);

export function calculateCompoundPricing(input: PricingInput): PricingResult {
  const { faceValue, daysToMaturity, baseSpread, riskMultiplier } = input;

  const monthlyRate = baseSpread.mul(riskMultiplier);
  const termMonths = new Decimal(daysToMaturity).div(DAYS_PER_MONTH);
  const discountFactor = new Decimal(1).add(monthlyRate).pow(termMonths);
  const netAmount = faceValue.mul(discountFactor);
  const discountAmount = faceValue.sub(netAmount);
  const discountRate = faceValue.isZero()
    ? new Decimal(0)
    : discountAmount.div(faceValue);

  return {
    discountRate,
    discountAmount,
    netAmount,
  };
}
