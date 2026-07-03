import { describe, it, expect } from 'vitest';
import { DuplicataStrategy } from './duplicata-strategy';
import { Decimal } from '@prisma/client/runtime/library';

describe('DuplicataStrategy', () => {
  const strategy = new DuplicataStrategy();

  it('should return correct strategy name', () => {
    expect(strategy.getStrategyName()).toBe('DuplicataStrategy');
  });

  it('should calculate discount for 90 days with 1.5% annual rate', () => {
    const result = strategy.calculate({
      faceValue: new Decimal(100000),
      daysToMaturity: 90,
      baseSpread: new Decimal(0.015),
      riskMultiplier: new Decimal(1.0),
    });

    // Expected: 0.015 * 1.0 * (90/360) = 0.00375
    expect(result.discountRate.toFixed(6)).toBe('0.003750');

    // Expected: 100000 * 0.00375 = 375
    expect(result.discountAmount.toFixed(2)).toBe('375.00');

    // Expected: 100000 - 375 = 99625
    expect(result.netAmount.toFixed(2)).toBe('99625.00');
  });

  it('should calculate discount for 60 days', () => {
    const result = strategy.calculate({
      faceValue: new Decimal(50000),
      daysToMaturity: 60,
      baseSpread: new Decimal(0.015),
      riskMultiplier: new Decimal(1.0),
    });

    // 0.015 * 1.0 * (60/360) = 0.0025
    expect(result.discountRate.toFixed(6)).toBe('0.002500');
    expect(result.discountAmount.toFixed(2)).toBe('125.00');
    expect(result.netAmount.toFixed(2)).toBe('49875.00');
  });

  it('should apply risk multiplier correctly', () => {
    const result = strategy.calculate({
      faceValue: new Decimal(100000),
      daysToMaturity: 90,
      baseSpread: new Decimal(0.015),
      riskMultiplier: new Decimal(1.5), // 50% higher risk
    });

    // 0.015 * 1.5 * (90/360) = 0.005625
    expect(result.discountRate.toFixed(6)).toBe('0.005625');
    expect(result.discountAmount.toFixed(2)).toBe('562.50');
    expect(result.netAmount.toFixed(2)).toBe('99437.50');
  });

  it('should handle 360 days (full year)', () => {
    const result = strategy.calculate({
      faceValue: new Decimal(100000),
      daysToMaturity: 360,
      baseSpread: new Decimal(0.015),
      riskMultiplier: new Decimal(1.0),
    });

    // Full year: rate should equal baseSpread
    expect(result.discountRate.toFixed(6)).toBe('0.015000');
    expect(result.discountAmount.toFixed(2)).toBe('1500.00');
    expect(result.netAmount.toFixed(2)).toBe('98500.00');
  });

  it('should handle small amounts', () => {
    const result = strategy.calculate({
      faceValue: new Decimal(1000),
      daysToMaturity: 30,
      baseSpread: new Decimal(0.015),
      riskMultiplier: new Decimal(1.0),
    });

    // 0.015 * 1.0 * (30/360) = 0.00125
    expect(result.discountRate.toFixed(6)).toBe('0.001250');
    expect(result.discountAmount.toFixed(2)).toBe('1.25');
    expect(result.netAmount.toFixed(2)).toBe('998.75');
  });

  it('should handle large amounts with precision', () => {
    const result = strategy.calculate({
      faceValue: new Decimal(10000000), // 10 million
      daysToMaturity: 180,
      baseSpread: new Decimal(0.015),
      riskMultiplier: new Decimal(1.0),
    });

    // 0.015 * 1.0 * (180/360) = 0.0075
    expect(result.discountRate.toFixed(6)).toBe('0.007500');
    expect(result.discountAmount.toFixed(2)).toBe('75000.00');
    expect(result.netAmount.toFixed(2)).toBe('9925000.00');
  });
});
