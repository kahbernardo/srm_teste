import { Decimal } from '@prisma/client/runtime/library';
import { PrismaClient, Transaction } from '@prisma/client';
import prisma from '../../persistence/prisma-client';
import { PricingStrategyFactory } from '../pricing/pricing-strategy-factory';
import { NotFoundError, BusinessError } from '../../presentation/errors';
import { eventStore } from '../../events/eventStore';
import { DomainEventTypes } from '../../events/domainEventTypes';
import { metrics } from '../../monitoring/metrics';

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

export interface PaginatedTransactions {
  data: Transaction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class TransactionService {
  constructor(private readonly db: PrismaClient = prisma) {}

  private async calculatePricing(input: CreateTransactionInput) {
    const start = Date.now();
    const assetType = await this.db.assetType.findUnique({
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
    const strategy = PricingStrategyFactory.getStrategy(pricingStrategy.strategyName);
    const pricingResult = strategy.calculate({
      faceValue: new Decimal(input.faceValue),
      daysToMaturity: input.daysToMaturity,
      baseSpread: new Decimal(pricingStrategy.baseSpread),
      riskMultiplier: new Decimal(pricingStrategy.riskMultiplier),
    });

    metrics.pricingDuration.observe(
      { strategy: pricingStrategy.strategyName },
      (Date.now() - start) / 1000
    );

    let exchangeRateApplied: Decimal | undefined;
    let convertedAmount: Decimal | undefined;

    if (input.targetCurrencyId && input.targetCurrencyId !== input.currencyId) {
      const exchangeRate = await this.db.exchangeRate.findFirst({
        where: {
          fromCurrencyId: input.currencyId,
          toCurrencyId: input.targetCurrencyId,
          validFrom: { lte: new Date() },
          OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
        },
        orderBy: { validFrom: 'desc' },
        include: { fromCurrency: true, toCurrency: true },
      });

      if (!exchangeRate) {
        throw new BusinessError(
          `No active exchange rate found from ${input.currencyId} to ${input.targetCurrencyId}`
        );
      }

      exchangeRateApplied = new Decimal(exchangeRate.rate);
      convertedAmount = pricingResult.netAmount.mul(new Decimal(exchangeRate.rate));

      const ageSeconds = (Date.now() - exchangeRate.validFrom.getTime()) / 1000;
      metrics.exchangeRateAge.set(
        {
          from_currency: exchangeRate.fromCurrency.code,
          to_currency: exchangeRate.toCurrency.code,
        },
        ageSeconds
      );
    }

    return { assetType, pricingStrategy, pricingResult, exchangeRateApplied, convertedAmount };
  }

  async simulateTransaction(input: CreateTransactionInput): Promise<TransactionResult & { assetTypeCode: string }> {
    const { assetType, pricingResult, exchangeRateApplied, convertedAmount } =
      await this.calculatePricing(input);

    return {
      id: 'simulation',
      faceValue: new Decimal(input.faceValue),
      discountRate: pricingResult.discountRate,
      discountAmount: pricingResult.discountAmount,
      netAmount: pricingResult.netAmount,
      convertedAmount,
      exchangeRateApplied,
      status: TransactionStatus.PENDING,
      assetTypeCode: assetType.code,
    };
  }

  async createTransaction(input: CreateTransactionInput): Promise<TransactionResult> {
    return await this.db.$transaction(async (tx) => {
      const { assetType, pricingResult, exchangeRateApplied, convertedAmount } =
        await this.calculatePricing(input);

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
        include: { currency: true },
      });

      await eventStore.append({
        aggregateId: transaction.id,
        aggregateType: 'Transaction',
        eventType: DomainEventTypes.TRANSACTION_CREATED,
        payload: {
          transactionId: transaction.id,
          faceValue: input.faceValue,
          createdBy: input.createdBy,
        },
      });

      await eventStore.append({
        aggregateId: transaction.id,
        aggregateType: 'Transaction',
        eventType: DomainEventTypes.TRANSACTION_PRICED,
        payload: {
          transactionId: transaction.id,
          discountRate: pricingResult.discountRate.toNumber(),
          netAmount: pricingResult.netAmount.toNumber(),
          strategy: assetType.code,
        },
      });

      metrics.transactionsTotal.inc({
        status: 'PENDING',
        currency: transaction.currency.code,
        asset_type: assetType.code,
      });
      metrics.transactionValue.observe(
        { currency: transaction.currency.code },
        input.faceValue
      );

      return {
        id: transaction.id,
        faceValue: new Decimal(transaction.faceValue),
        discountRate: new Decimal(transaction.discountRate),
        discountAmount: new Decimal(transaction.discountAmount),
        netAmount: new Decimal(transaction.netAmount),
        convertedAmount: transaction.convertedAmount
          ? new Decimal(transaction.convertedAmount)
          : undefined,
        exchangeRateApplied: transaction.exchangeRateApplied
          ? new Decimal(transaction.exchangeRateApplied)
          : undefined,
        status: transaction.status as TransactionStatus,
      };
    });
  }

  async settleTransaction(transactionId: string): Promise<Transaction> {
    return await this.db.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { currency: true, assetType: true },
      });

      if (!transaction) {
        throw new NotFoundError('Transaction not found');
      }

      if (transaction.status !== 'PENDING') {
        throw new BusinessError(`Transaction cannot be settled. Current status: ${transaction.status}`);
      }

      const settled = await tx.transaction.update({
        where: {
          id: transactionId,
          version: transaction.version,
        },
        data: {
          status: 'SETTLED',
          settledAt: new Date(),
          version: { increment: 1 },
        },
      });

      await eventStore.append({
        aggregateId: transactionId,
        aggregateType: 'Transaction',
        eventType: DomainEventTypes.TRANSACTION_SETTLED,
        payload: {
          transactionId,
          settledAt: new Date().toISOString(),
          netAmount: transaction.netAmount,
        },
      });

      metrics.transactionsTotal.inc({
        status: 'SETTLED',
        currency: transaction.currency.code,
        asset_type: transaction.assetType.code,
      });

      return settled;
    });
  }

  async getTransaction(transactionId: string): Promise<Transaction | null> {
    return await this.db.transaction.findUnique({
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
    page?: number;
    pageSize?: number;
    limit?: number;
  }): Promise<PaginatedTransactions> {
    const where: Record<string, unknown> = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.currencyId) where.currencyId = filters.currencyId;
    if (filters?.assetTypeId) where.assetTypeId = filters.assetTypeId;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) (where.createdAt as Record<string, Date>).gte = filters.startDate;
      if (filters.endDate) (where.createdAt as Record<string, Date>).lte = filters.endDate;
    }

    const pageSize = filters?.pageSize ?? filters?.limit ?? 20;
    const page = filters?.page ?? 1;
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      this.db.transaction.findMany({
        where,
        include: { assetType: true, currency: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.db.transaction.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }
}
