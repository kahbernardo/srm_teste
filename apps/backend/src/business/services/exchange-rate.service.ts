import { ExchangeRate } from '@prisma/client';
import prisma from '../../persistence/prisma-client';
import { exchangeRateCircuitBreaker } from '../resilience/circuitBreaker';
import { getCached, setCached, cacheKey } from '../cache/exchangeRateCache';
import { eventStore } from '../../events/eventStore';
import { DomainEventTypes } from '../../events/domainEventTypes';
import { metrics } from '../../monitoring/metrics';

export interface CreateExchangeRateInput {
  fromCurrencyId: string;
  toCurrencyId: string;
  rate: number;
  source: string;
  validFrom?: Date;
}

export class ExchangeRateService {
  async getCurrentRate(
    fromCurrencyId: string,
    toCurrencyId: string
  ): Promise<ExchangeRate | null> {
    const key = cacheKey(['exchange-rate', fromCurrencyId, toCurrencyId]);
    const cached = await getCached<ExchangeRate>(key);
    if (cached) return cached;

    const rate = await exchangeRateCircuitBreaker.execute(
      () =>
        prisma.exchangeRate.findFirst({
          where: {
            fromCurrencyId,
            toCurrencyId,
            validFrom: { lte: new Date() },
            OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
          },
          orderBy: { validFrom: 'desc' },
          include: {
            fromCurrency: true,
            toCurrency: true,
          },
        }),
      () => null
    );

    if (rate) await setCached(key, rate, 60);
    return rate;
  }

  async createExchangeRate(input: CreateExchangeRateInput): Promise<ExchangeRate> {
    // Invalidate previous rate (set validUntil)
    const now = input.validFrom || new Date();

    await prisma.exchangeRate.updateMany({
      where: {
        fromCurrencyId: input.fromCurrencyId,
        toCurrencyId: input.toCurrencyId,
        validUntil: null,
      },
      data: {
        validUntil: now,
      },
    });

    // Create new rate
    const created = await prisma.exchangeRate.create({
      data: {
        fromCurrencyId: input.fromCurrencyId,
        toCurrencyId: input.toCurrencyId,
        rate: input.rate,
        source: input.source,
        validFrom: now,
        validUntil: null,
      },
      include: {
        fromCurrency: true,
        toCurrency: true,
      },
    });

    await eventStore.append({
      aggregateId: created.id,
      aggregateType: 'ExchangeRate',
      eventType: DomainEventTypes.EXCHANGE_RATE_UPDATED,
      payload: {
        fromCurrency: created.fromCurrency.code,
        toCurrency: created.toCurrency.code,
        rate: input.rate,
        source: input.source,
      },
    });

    metrics.exchangeRateAge.set(
      {
        from_currency: created.fromCurrency.code,
        to_currency: created.toCurrency.code,
      },
      0
    );

    return created;
  }

  async listExchangeRates(currencyId?: string): Promise<ExchangeRate[]> {
    const where: any = {
      validFrom: { lte: new Date() },
      OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
    };

    if (currencyId) {
      where.OR = [
        { fromCurrencyId: currencyId },
        { toCurrencyId: currencyId },
      ];
    }

    return await prisma.exchangeRate.findMany({
      where,
      include: {
        fromCurrency: true,
        toCurrency: true,
      },
      orderBy: { validFrom: 'desc' },
    });
  }
}
