import { FastifyRequest, FastifyReply } from 'fastify';
import { TransactionService, TransactionStatus } from '../../business/services/transaction.service';
import { z } from 'zod';
import { NotFoundError } from '../errors';

const transactionService = new TransactionService();

const createTransactionSchema = z.object({
  externalReference: z.string().optional(),
  assetTypeId: z.string().uuid(),
  currencyId: z.string().uuid(),
  faceValue: z.number().positive(),
  daysToMaturity: z.number().int().positive(),
  targetCurrencyId: z.string().uuid().optional(),
  createdBy: z.string(),
});

const listTransactionsSchema = z.object({
  status: z.enum(['PENDING', 'SETTLED', 'FAILED', 'CANCELLED']).optional(),
  currencyId: z.string().uuid().optional(),
  assetTypeId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().positive().max(1000).optional(),
});

export async function createTransaction(request: FastifyRequest, reply: FastifyReply) {
  const body = createTransactionSchema.parse(request.body);
  const result = await transactionService.createTransaction(body);

  reply.status(201);
  return {
    success: true,
    data: result,
  };
}

export async function settleTransaction(request: FastifyRequest, _reply: FastifyReply) {
  const { transactionId } = request.params as { transactionId: string };
  const result = await transactionService.settleTransaction(transactionId);

  return {
    success: true,
    data: result,
  };
}

export async function getTransaction(request: FastifyRequest, _reply: FastifyReply) {
  const { transactionId } = request.params as { transactionId: string };
  const result = await transactionService.getTransaction(transactionId);

  if (!result) {
    throw new NotFoundError('Transaction not found');
  }

  return {
    success: true,
    data: result,
  };
}

export async function listTransactions(request: FastifyRequest, _reply: FastifyReply) {
  const query = listTransactionsSchema.parse(request.query);

  const filters = {
    ...query,
    status: query.status as TransactionStatus | undefined,
    startDate: query.startDate ? new Date(query.startDate) : undefined,
    endDate: query.endDate ? new Date(query.endDate) : undefined,
  };

  const result = await transactionService.listTransactions(filters);

  return {
    success: true,
    data: result,
    count: result.length,
  };
}
