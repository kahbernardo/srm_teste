import {
  IPricingStrategy,
  PricingInput,
  PricingResult,
} from './pricing-strategy.interface';
import { calculateCompoundPricing } from './compoundPricing';

export class ChequeStrategy implements IPricingStrategy {
  getStrategyName(): string {
    return 'ChequeStrategy';
  }

  calculate(input: PricingInput): PricingResult {
    return calculateCompoundPricing(input);
  }
}
