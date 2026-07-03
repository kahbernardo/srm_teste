import { describe, it, expect } from 'vitest';
import { ChequeStrategy } from './cheque-strategy';
import { Decimal } from '@prisma/client/runtime/library';

describe('ChequeStrategy', () => {
  const strategy = new ChequeStrategy();

  it('should return correct strategy name', () => {
    expect(strategy.getStrategyName()).toBe('ChequeStrategy');
  });

  it('should apply 20% risk premium on top of base risk', () => {
    const result = strategy.calculate({
      faceValue: new Decimal(100000),
      daysToMaturity: 90,
      baseSpread: new Decimal(0.025), // 2.5% base
      riskMultiplier: new Decimal(1.0),
    });

    // baseSpread * riskMultiplier * CHEQUE_RISK_PREMIUM * (days/360)
    // 0.025 * 1.0 * 1.2 * (90/360) = 0.0075
    expect(result.discountRate.toFixed(6)).toBe('0.007500');
    expect(result.discountAmount.toFixed(2)).toBe('750.00');
    expect(result.netAmount.toFixed(2)).toBe('99250.00');
  });

  it('should compound risk multiplier with cheque premium', () => {
    const result = strategy.calculate({
      faceValue: new Decimal(50000),
      daysToMaturity: 60,
      baseSpread: new Decimal(0.025),
      riskMultiplier: new Decimal(1.5), // External risk multiplier
    });

    // 0.025 * 1.5 * 1.2 * (60/360) = 0.0075
    expect(result.discountRate.toFixed(6)).toBe('0.007500');
    expect(result.discountAmount.toFixed(2)).toBe('375.00');
    expect(result.netAmount.toFixed(2)).toBe('49625.00');
  });

  it('should charge more than duplicata strategy for same inputs', () => {
    const chequeResult = strategy.calculate({
      faceValue: new Decimal(100000),
      daysToMaturity: 90,
      baseSpread: new Decimal(0.015),
      riskMultiplier: new Decimal(1.0),
    });

    // Cheque: 0.015 * 1.0 * 1.2 * (90/360) = 0.0045
    expect(chequeResult.discountRate.toFixed(6)).toBe('0.004500');
    expect(chequeResult.discountAmount.toFixed(2)).toBe('450.00');

    // Compare with Duplicata (would be 375.00)
    // Cheque should charge 20% more
    expect(parseFloat(chequeResult.discountAmount.toFixed(2))).toBeGreaterThan(375);
  });

  it('should handle short maturity periods', () => {
    const result = strategy.calculate({
      faceValue: new Decimal(30000),
      daysToMaturity: 15,
      baseSpread: new Decimal(0.025),
      riskMultiplier: new Decimal(1.0),
    });

    // 0.025 * 1.0 * 1.2 * (15/360) = 0.00125
    expect(result.discountRate.toFixed(6)).toBe('0.001250');
    expect(result.discountAmount.toFixed(2)).toBe('37.50');
    expect(result.netAmount.toFixed(2)).toBe('29962.50');
  });

  it('should maintain precision for large amounts', () => {
    const result = strategy.calculate({
      faceValue: new Decimal(5000000),
      daysToMaturity: 120,
      baseSpread: new Decimal(0.025),
      riskMultiplier: new Decimal(1.0),
    });

    // 0.025 * 1.0 * 1.2 * (120/360) = 0.01
    expect(result.discountRate.toFixed(6)).toBe('0.010000');
    expect(result.discountAmount.toFixed(2)).toBe('50000.00');
    expect(result.netAmount.toFixed(2)).toBe('4950000.00');
  });
});
