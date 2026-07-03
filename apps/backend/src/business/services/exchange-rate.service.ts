import prisma from '../../persistence/prisma-client';
import { ExchangeRate } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

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
    return await prisma.exchangeRate.findFirst({
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
    });
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
    return await prisma.exchangeRate.create({
      data: {
        fromCurrencyId: input.fromCurrencyId,
        toCurrencyId: input.toCurrencyId,
        rate: new Decimal(input.rate),
        source: input.source,
        validFrom: now,
        validUntil: null,
      },
      include: {
        fromCurrency: true,
        toCurrency: true,
      },
    });
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
