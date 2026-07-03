import { describe, it, expect } from 'vitest';
import { ChequeStrategy } from './cheque-strategy';
import { DuplicataStrategy } from './duplicata-strategy';
import { Decimal } from '@prisma/client/runtime/library';

describe('ChequeStrategy', () => {
  const strategy = new ChequeStrategy();

  it('should return correct strategy name', () => {
    expect(strategy.getStrategyName()).toBe('ChequeStrategy');
  });

  it('should apply risk multiplier from configuration', () => {
    const result = strategy.calculate({
      faceValue: new Decimal(100000),
      daysToMaturity: 90,
      baseSpread: new Decimal(0.025),
      riskMultiplier: new Decimal(1.2),
    });

    expect(result.netAmount.toFixed(2)).toBe('91514.17');
    expect(result.discountAmount.toFixed(2)).toBe('8485.83');
  });

  it('should compound risk multiplier with higher spread', () => {
    const result = strategy.calculate({
      faceValue: new Decimal(50000),
      daysToMaturity: 60,
      baseSpread: new Decimal(0.025),
      riskMultiplier: new Decimal(1.5),
    });

    expect(result.netAmount.toFixed(2)).toBe('46450.86');
    expect(result.discountAmount.toFixed(2)).toBe('3549.14');
  });

  it('should charge more than duplicata strategy for same inputs', () => {
    const chequeResult = strategy.calculate({
      faceValue: new Decimal(100000),
      daysToMaturity: 90,
      baseSpread: new Decimal(0.025),
      riskMultiplier: new Decimal(1.2),
    });

    const duplicataStrategy = new DuplicataStrategy();
    const duplicataResult = duplicataStrategy.calculate({
      faceValue: new Decimal(100000),
      daysToMaturity: 90,
      baseSpread: new Decimal(0.015),
      riskMultiplier: new Decimal(1.0),
    });

    expect(chequeResult.discountAmount.gt(duplicataResult.discountAmount)).toBe(true);
  });

  it('should handle short maturity periods', () => {
    const result = strategy.calculate({
      faceValue: new Decimal(30000),
      daysToMaturity: 15,
      baseSpread: new Decimal(0.025),
      riskMultiplier: new Decimal(1.2),
    });

    expect(result.netAmount.toFixed(2)).toBe('29559.88');
    expect(result.discountAmount.toFixed(2)).toBe('440.12');
  });

  it('should maintain precision for large amounts', () => {
    const result = strategy.calculate({
      faceValue: new Decimal(5000000),
      daysToMaturity: 120,
      baseSpread: new Decimal(0.025),
      riskMultiplier: new Decimal(1.2),
    });

    expect(result.netAmount.toFixed(2)).toBe('4442435.24');
    expect(result.discountAmount.toFixed(2)).toBe('557564.76');
  });
});
