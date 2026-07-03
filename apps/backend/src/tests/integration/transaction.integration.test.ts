import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { TransactionService } from '../../business/services/transaction.service';
import { NotFoundError, BusinessError } from '../../presentation/errors';
import { querySettlementExtract } from '../../persistence/repositories/settlementExtract.repository';
import { getTestPrisma, cleanDatabase } from './setup';

describe('Transaction Integration Tests', () => {
  let transactionService: TransactionService;
  let prisma: ReturnType<typeof getTestPrisma>;
  let currencyBRL: { id: string };
  let currencyUSD: { id: string };
  let assetTypeDuplicata: { id: string };

  beforeEach(async () => {
    await cleanDatabase();

    prisma = getTestPrisma();
    transactionService = new TransactionService(prisma as unknown as PrismaClient);

    currencyBRL = await prisma.currency.create({
      data: {
        code: 'BRL',
        name: 'Brazilian Real',
        symbol: 'R$',
        active: true,
      },
    });

    currencyUSD = await prisma.currency.create({
      data: {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        active: true,
      },
    });

    assetTypeDuplicata = await prisma.assetType.create({
      data: {
        code: 'DUPLICATA',
        name: 'Duplicata Mercantil',
        description: 'Título de crédito',
        active: true,
        pricingStrategies: {
          create: {
            strategyName: 'DuplicataStrategy',
            baseSpread: 0.015,
            minSpread: 0.01,
            maxSpread: 0.03,
            riskMultiplier: 1.0,
            validFrom: new Date('2024-01-01'),
            active: true,
          },
        },
      },
    });

    await prisma.exchangeRate.create({
      data: {
        fromCurrencyId: currencyBRL.id,
        toCurrencyId: currencyUSD.id,
        rate: 0.2,
        validFrom: new Date('2024-01-01'),
        source: 'MANUAL',
      },
    });
  });

  describe('Database Transactions - Rollback on Error', () => {
    it('should rollback transaction creation if error occurs', async () => {
      const initialCount = await prisma.transaction.count();

      await expect(
        transactionService.createTransaction({
          assetTypeId: '00000000-0000-0000-0000-000000000000',
          currencyId: currencyBRL.id,
          faceValue: 10000,
          daysToMaturity: 90,
          createdBy: 'test-user',
        })
      ).rejects.toThrow(NotFoundError);

      const finalCount = await prisma.transaction.count();
      expect(finalCount).toBe(initialCount);
    });

    it('should rollback transaction if exchange rate not found', async () => {
      const initialCount = await prisma.transaction.count();

      await expect(
        transactionService.createTransaction({
          assetTypeId: assetTypeDuplicata.id,
          currencyId: currencyUSD.id,
          targetCurrencyId: currencyBRL.id,
          faceValue: 10000,
          daysToMaturity: 90,
          createdBy: 'test-user',
        })
      ).rejects.toThrow(BusinessError);

      const finalCount = await prisma.transaction.count();
      expect(finalCount).toBe(initialCount);
    });

    it('should rollback if no active pricing strategy found', async () => {
      const assetTypeNoPricing = await prisma.assetType.create({
        data: {
          code: 'TEST',
          name: 'Test Asset',
          active: true,
        },
      });

      const initialCount = await prisma.transaction.count();

      await expect(
        transactionService.createTransaction({
          assetTypeId: assetTypeNoPricing.id,
          currencyId: currencyBRL.id,
          faceValue: 10000,
          daysToMaturity: 90,
          createdBy: 'test-user',
        })
      ).rejects.toThrow(BusinessError);

      const finalCount = await prisma.transaction.count();
      expect(finalCount).toBe(initialCount);
    });
  });

  describe('Database Transactions - Successful Commit', () => {
    it('should successfully commit transaction with all data', async () => {
      const result = await transactionService.createTransaction({
        externalReference: 'TEST-001',
        assetTypeId: assetTypeDuplicata.id,
        currencyId: currencyBRL.id,
        faceValue: 10000,
        daysToMaturity: 90,
        createdBy: 'test-user',
      });

      const transaction = await prisma.transaction.findUnique({
        where: { id: result.id },
      });

      expect(transaction).toBeTruthy();
      expect(transaction?.externalReference).toBe('TEST-001');
      expect(transaction?.status).toBe('PENDING');
      expect(Number(transaction?.faceValue)).toBe(10000);
      expect(transaction?.daysToMaturity).toBe(90);

      expect(Number(transaction!.discountRate)).toBeCloseTo(0.043683, 4);
      expect(Number(transaction!.discountAmount)).toBeCloseTo(436.83, 1);
      expect(Number(transaction!.netAmount)).toBeCloseTo(9563.17, 1);

      const auditEntries = await prisma.auditLog.findMany({
        where: { entityId: result.id, action: 'CREATE' },
      });
      expect(auditEntries).toHaveLength(1);
      expect(auditEntries[0].performedBy).toBe('test-user');
    });

    it('should create transaction with currency conversion', async () => {
      const result = await transactionService.createTransaction({
        assetTypeId: assetTypeDuplicata.id,
        currencyId: currencyBRL.id,
        targetCurrencyId: currencyUSD.id,
        faceValue: 10000,
        daysToMaturity: 90,
        createdBy: 'test-user',
      });

      const transaction = await prisma.transaction.findUnique({
        where: { id: result.id },
      });

      expect(Number(transaction?.exchangeRateApplied)).toBe(0.2);
      expect(transaction?.convertedAmount).toBeDefined();
      expect(transaction?.targetCurrencyId).toBe(currencyUSD.id);

      const expectedConverted = Number(transaction!.netAmount) * 0.2;
      expect(Number(transaction!.convertedAmount)).toBeCloseTo(expectedConverted, 2);
    });

    it('should atomically create transaction and related data', async () => {
      const beforeTransactions = await prisma.transaction.count();

      await transactionService.createTransaction({
        assetTypeId: assetTypeDuplicata.id,
        currencyId: currencyBRL.id,
        faceValue: 10000,
        daysToMaturity: 90,
        createdBy: 'test-user',
      });

      const afterTransactions = await prisma.transaction.count();
      expect(afterTransactions).toBe(beforeTransactions + 1);
    });
  });

  describe('Optimistic Locking - Concurrency Control', () => {
    it('should handle optimistic locking on concurrent updates', async () => {
      const created = await transactionService.createTransaction({
        assetTypeId: assetTypeDuplicata.id,
        currencyId: currencyBRL.id,
        faceValue: 10000,
        daysToMaturity: 90,
        createdBy: 'test-user',
      });

      const transaction1 = await prisma.transaction.findUnique({
        where: { id: created.id },
      });

      const transaction2 = await prisma.transaction.findUnique({
        where: { id: created.id },
      });

      expect(transaction1!.version).toBe(1);
      expect(transaction2!.version).toBe(1);

      await prisma.transaction.update({
        where: {
          id: created.id,
          version: transaction1!.version,
        },
        data: {
          status: 'SETTLED',
          version: { increment: 1 },
        },
      });

      await expect(
        prisma.transaction.update({
          where: {
            id: created.id,
            version: transaction2!.version,
          },
          data: {
            status: 'CANCELLED',
            version: { increment: 1 },
          },
        })
      ).rejects.toThrow();

      const final = await prisma.transaction.findUnique({
        where: { id: created.id },
      });
      expect(final!.status).toBe('SETTLED');
      expect(final!.version).toBe(2);
    });

    it('should increment version on successful settle', async () => {
      const created = await transactionService.createTransaction({
        assetTypeId: assetTypeDuplicata.id,
        currencyId: currencyBRL.id,
        faceValue: 10000,
        daysToMaturity: 90,
        createdBy: 'test-user',
      });

      const beforeSettle = await prisma.transaction.findUnique({
        where: { id: created.id },
      });

      const initialVersion = beforeSettle!.version;
      expect(initialVersion).toBe(1);

      await transactionService.settleTransaction(created.id);

      const afterSettle = await prisma.transaction.findUnique({
        where: { id: created.id },
      });

      expect(afterSettle!.version).toBe(initialVersion + 1);
      expect(afterSettle!.status).toBe('SETTLED');
    });

    it('should prevent race conditions on settle', async () => {
      const created = await transactionService.createTransaction({
        assetTypeId: assetTypeDuplicata.id,
        currencyId: currencyBRL.id,
        faceValue: 10000,
        daysToMaturity: 90,
        createdBy: 'test-user',
      });

      const settle1 = transactionService.settleTransaction(created.id);

      await settle1;

      await expect(
        transactionService.settleTransaction(created.id)
      ).rejects.toThrow(BusinessError);
    });
  });

  describe('Business Logic Validation', () => {
    it('should prevent settling already settled transaction', async () => {
      const created = await transactionService.createTransaction({
        assetTypeId: assetTypeDuplicata.id,
        currencyId: currencyBRL.id,
        faceValue: 10000,
        daysToMaturity: 90,
        createdBy: 'test-user',
      });

      await transactionService.settleTransaction(created.id);

      await expect(
        transactionService.settleTransaction(created.id)
      ).rejects.toThrow(BusinessError);

      await expect(
        transactionService.settleTransaction(created.id)
      ).rejects.toThrow('Transaction cannot be settled. Current status: SETTLED');
    });

    it('should validate transaction exists before settling', async () => {
      await expect(
        transactionService.settleTransaction('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow(NotFoundError);
    });

    it('should validate asset type is active', async () => {
      const inactiveAsset = await prisma.assetType.create({
        data: {
          code: 'INACTIVE',
          name: 'Inactive Asset',
          active: false,
          pricingStrategies: {
            create: {
              strategyName: 'DuplicataStrategy',
              baseSpread: 0.015,
              minSpread: 0.01,
              maxSpread: 0.03,
              riskMultiplier: 1.0,
              validFrom: new Date('2024-01-01'),
              active: true,
            },
          },
        },
      });

      await expect(
        transactionService.createTransaction({
          assetTypeId: inactiveAsset.id,
          currencyId: currencyBRL.id,
          faceValue: 10000,
          daysToMaturity: 90,
          createdBy: 'test-user',
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('Data Cleanup Between Tests', () => {
    it('should start with clean database', async () => {
      const transactionCount = await prisma.transaction.count();
      expect(transactionCount).toBe(0);
    });

    it('should isolate test data', async () => {
      await transactionService.createTransaction({
        assetTypeId: assetTypeDuplicata.id,
        currencyId: currencyBRL.id,
        faceValue: 5000,
        daysToMaturity: 30,
        createdBy: 'test-user',
      });

      const count = await prisma.transaction.count();
      expect(count).toBe(1);
    });

    it('should verify cleanup worked', async () => {
      const count = await prisma.transaction.count();
      expect(count).toBe(0);
    });
  });

  describe('Settlement Extract (native SQL)', () => {
    it('should return only settled transactions filtered by cedente', async () => {
      const pending = await transactionService.createTransaction({
        assetTypeId: assetTypeDuplicata.id,
        currencyId: currencyBRL.id,
        faceValue: 5000,
        daysToMaturity: 30,
        createdBy: 'cedente-alpha',
      });

      const toSettle = await transactionService.createTransaction({
        assetTypeId: assetTypeDuplicata.id,
        currencyId: currencyBRL.id,
        faceValue: 10000,
        daysToMaturity: 90,
        createdBy: 'cedente-beta',
      });

      await transactionService.settleTransaction(toSettle.id);

      const extract = await querySettlementExtract(
        { cedente: 'cedente-beta', page: 1, pageSize: 20 },
        prisma as unknown as PrismaClient
      );

      expect(extract.total).toBe(1);
      expect(extract.data[0].id).toBe(toSettle.id);
      expect(extract.data[0].created_by).toBe('cedente-beta');

      const pendingStill = await prisma.transaction.findUnique({ where: { id: pending.id } });
      expect(pendingStill?.status).toBe('PENDING');
    });

    it('should filter settlement extract by currency', async () => {
      const tx = await transactionService.createTransaction({
        assetTypeId: assetTypeDuplicata.id,
        currencyId: currencyUSD.id,
        faceValue: 8000,
        daysToMaturity: 60,
        createdBy: 'cedente-usd',
      });

      await transactionService.settleTransaction(tx.id);

      const brlOnly = await querySettlementExtract(
        { currencyId: currencyBRL.id },
        prisma as unknown as PrismaClient
      );
      const usdOnly = await querySettlementExtract(
        { currencyId: currencyUSD.id },
        prisma as unknown as PrismaClient
      );

      expect(brlOnly.total).toBe(0);
      expect(usdOnly.total).toBe(1);
      expect(usdOnly.data[0].currency_code).toBe('USD');
    });
  });
});
