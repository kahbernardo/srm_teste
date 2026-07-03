import { IPricingStrategy } from './pricing-strategy.interface';
import { DuplicataStrategy } from './duplicata-strategy';
import { ChequeStrategy } from './cheque-strategy';

export class PricingStrategyFactory {
  private static strategies = new Map<string, IPricingStrategy>([
    ['DuplicataStrategy', new DuplicataStrategy()],
    ['ChequeStrategy', new ChequeStrategy()],
  ]);

  static getStrategy(strategyName: string): IPricingStrategy {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      throw new Error(`Pricing strategy not found: ${strategyName}`);
    }
    return strategy;
  }

  static registerStrategy(name: string, strategy: IPricingStrategy): void {
    this.strategies.set(name, strategy);
  }

  static getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }
}
