import {
  IPricingStrategy,
  PricingInput,
  PricingResult,
} from './pricing-strategy.interface';
import { calculateCompoundPricing } from './compoundPricing';

export class DuplicataStrategy implements IPricingStrategy {
  getStrategyName(): string {
    return 'DuplicataStrategy';
  }

  calculate(input: PricingInput): PricingResult {
    return calculateCompoundPricing(input);
  }
}
