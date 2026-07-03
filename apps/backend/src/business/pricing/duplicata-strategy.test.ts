import { describe, it, expect } from 'vitest';
import { DuplicataStrategy } from './duplicata-strategy';
import { Decimal } from '@prisma/client/runtime/library';

describe('DuplicataStrategy', () => {
  const strategy = new DuplicataStrategy();

  it('should return correct strategy name', () => {
    expect(strategy.getStrategyName()).toBe('DuplicataStrategy');
  });

  it('should calculate compound discount for 90 days with 1.5% monthly rate', () => {
    const result = strategy.calculate({
      faceValue: new Decimal(100000),
      daysToMaturity: 90,
      baseSpread: new Decimal(0.015),
      riskMultiplier: new Decimal(1.0),
    });

    expect(result.netAmount.toFixed(2)).toBe('95631.70');
    expect(result.discountAmount.toFixed(2)).toBe('4368.30');
    expect(result.discountRate.toFixed(6)).toBe('0.043683');
  });

  it('should calculate compound discount for 60 days', () => {
    const result = strategy.calculate({
      faceValue: new Decimal(50000),
      daysToMaturity: 60,
      baseSpread: new Decimal(0.015),
      riskMultiplier: new Decimal(1.0),
    });

    expect(result.netAmount.toFixed(2)).toBe('48533.09');
    expect(result.discountAmount.toFixed(2)).toBe('1466.91');
  });

  it('should apply risk multiplier correctly', () => {
    const result = strategy.calculate({
      faceValue: new Decimal(100000),
      daysToMaturity: 90,
      baseSpread: new Decimal(0.015),
      riskMultiplier: new Decimal(1.5),
    });

    expect(result.netAmount.toFixed(2)).toBe('93542.73');
    expect(result.discountAmount.toFixed(2)).toBe('6457.27');
  });

  it('should handle 360 days (12 months)', () => {
    const result = strategy.calculate({
      faceValue: new Decimal(100000),
      daysToMaturity: 360,
      baseSpread: new Decimal(0.015),
      riskMultiplier: new Decimal(1.0),
    });

    expect(result.netAmount.toFixed(2)).toBe('83638.74');
    expect(result.discountAmount.toFixed(2)).toBe('16361.26');
  });

  it('should handle small amounts', () => {
    const result = strategy.calculate({
      faceValue: new Decimal(1000),
      daysToMaturity: 30,
      baseSpread: new Decimal(0.015),
      riskMultiplier: new Decimal(1.0),
    });

    expect(result.netAmount.toFixed(2)).toBe('985.22');
    expect(result.discountAmount.toFixed(2)).toBe('14.78');
  });

  it('should handle large amounts with precision', () => {
    const result = strategy.calculate({
      faceValue: new Decimal(10000000),
      daysToMaturity: 180,
      baseSpread: new Decimal(0.015),
      riskMultiplier: new Decimal(1.0),
    });

    expect(result.netAmount.toFixed(2)).toBe('9145421.93');
    expect(result.discountAmount.toFixed(2)).toBe('854578.07');
  });
});
