import prisma from '../../persistence/prisma-client';
import { Currency } from '@prisma/client';

export class CurrencyService {
  async listCurrencies(activeOnly = true): Promise<Currency[]> {
    return await prisma.currency.findMany({
      where: activeOnly ? { active: true } : {},
      orderBy: { code: 'asc' },
    });
  }

  async getCurrency(id: string): Promise<Currency | null> {
    return await prisma.currency.findUnique({
      where: { id },
    });
  }

  async getCurrencyByCode(code: string): Promise<Currency | null> {
    return await prisma.currency.findUnique({
      where: { code },
    });
  }
}
