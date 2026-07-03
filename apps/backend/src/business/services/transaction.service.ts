import { Decimal } from '@prisma/client/runtime/library';
import { Transaction } from '@prisma/client';
import prisma from '../../persistence/prisma-client';
import { PricingStrategyFactory } from '../pricing/pricing-strategy-factory';
import { NotFoundError, BusinessError } from '../../presentation/errors';

// SQLite doesn't support enums, so we define it here
export enum TransactionStatus {
  PENDING = 'PENDING',
  SETTLED = 'SETTLED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface CreateTransactionInput {
  externalReference?: string;
  assetTypeId: string;
  currencyId: string;
  faceValue: number;
  daysToMaturity: number;
  targetCurrencyId?: string;
  createdBy: string;
}

export interface TransactionResult {
  id: string;
  faceValue: Decimal;
  discountRate: Decimal;
  discountAmount: Decimal;
  netAmount: Decimal;
  convertedAmount?: Decimal;
  exchangeRateApplied?: Decimal;
  status: TransactionStatus;
}

export class TransactionService {
  async createTransaction(input: CreateTransactionInput): Promise<TransactionResult> {
    return await prisma.$transaction(async (tx) => {
      // 1. Buscar tipo de ativo e estratégia de pricing ativa
      const assetType = await tx.assetType.findUnique({
        where: { id: input.assetTypeId },
        include: {
          pricingStrategies: {
            where: {
              active: true,
              validFrom: { lte: new Date() },
              OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
            },
            orderBy: { validFrom: 'desc' },
            take: 1,
          },
        },
      });

      if (!assetType || !assetType.active) {
        throw new NotFoundError('Asset type not found or inactive');
      }

      if (assetType.pricingStrategies.length === 0) {
        throw new BusinessError('No active pricing strategy found for this asset type');
      }

      const pricingStrategy = assetType.pricingStrategies[0];

      // 2. Calcular pricing usando Strategy Pattern
      const strategy = PricingStrategyFactory.getStrategy(pricingStrategy.strategyName);
      const pricingResult = strategy.calculate({
        faceValue: new Decimal(input.faceValue),
        daysToMaturity: input.daysToMaturity,
        baseSpread: new Decimal(pricingStrategy.baseSpread),
        riskMultiplier: new Decimal(pricingStrategy.riskMultiplier),
      });

      // 3. Conversão cambial (se necessário)
      let exchangeRateApplied: Decimal | undefined;
      let convertedAmount: Decimal | undefined;

      if (input.targetCurrencyId && input.targetCurrencyId !== input.currencyId) {
        const exchangeRate = await tx.exchangeRate.findFirst({
          where: {
            fromCurrencyId: input.currencyId,
            toCurrencyId: input.targetCurrencyId,
            validFrom: { lte: new Date() },
            OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
          },
          orderBy: { validFrom: 'desc' },
        });

        if (!exchangeRate) {
          throw new BusinessError(
            `No active exchange rate found from ${input.currencyId} to ${input.targetCurrencyId}`
          );
        }

        exchangeRateApplied = new Decimal(exchangeRate.rate);
        convertedAmount = pricingResult.netAmount.mul(new Decimal(exchangeRate.rate));
      }

      // 4. Criar transação
      const transaction = await tx.transaction.create({
        data: {
          externalReference: input.externalReference,
          assetTypeId: input.assetTypeId,
          currencyId: input.currencyId,
          faceValue: input.faceValue,
          daysToMaturity: input.daysToMaturity,
          discountRate: pricingResult.discountRate.toNumber(),
          discountAmount: pricingResult.discountAmount.toNumber(),
          netAmount: pricingResult.netAmount.toNumber(),
          exchangeRateApplied: exchangeRateApplied?.toNumber(),
          convertedAmount: convertedAmount?.toNumber(),
          targetCurrencyId: input.targetCurrencyId,
          status: 'PENDING',
          createdBy: input.createdBy,
        },
      });

      return {
        id: transaction.id,
        faceValue: new Decimal(transaction.faceValue),
        discountRate: new Decimal(transaction.discountRate),
        discountAmount: new Decimal(transaction.discountAmount),
        netAmount: new Decimal(transaction.netAmount),
        convertedAmount: transaction.convertedAmount ? new Decimal(transaction.convertedAmount) : undefined,
        exchangeRateApplied: transaction.exchangeRateApplied ? new Decimal(transaction.exchangeRateApplied) : undefined,
        status: transaction.status as TransactionStatus,
      };
    });
  }

  async settleTransaction(transactionId: string): Promise<Transaction> {
    return await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
      });

      if (!transaction) {
        throw new NotFoundError('Transaction not found');
      }

      if (transaction.status !== 'PENDING') {
        throw new BusinessError(`Transaction cannot be settled. Current status: ${transaction.status}`);
      }

      return await tx.transaction.update({
        where: {
          id: transactionId,
          version: transaction.version, // Optimistic locking
        },
        data: {
          status: 'SETTLED',
          settledAt: new Date(),
          version: { increment: 1 },
        },
      });
    });
  }

  async getTransaction(transactionId: string): Promise<Transaction | null> {
    return await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        assetType: true,
        currency: true,
      },
    });
  }

  async listTransactions(filters?: {
    status?: TransactionStatus;
    currencyId?: string;
    assetTypeId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<Transaction[]> {
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.currencyId) where.currencyId = filters.currencyId;
    if (filters?.assetTypeId) where.assetTypeId = filters.assetTypeId;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    return await prisma.transaction.findMany({
      where,
      include: {
        assetType: true,
        currency: true,
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100,
    });
  }
}
