import { FastifyRequest, FastifyReply } from 'fastify';
import { TransactionService, TransactionStatus } from '../../business/services/transaction.service';
import { z } from 'zod';

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

export async function createTransaction(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const body = createTransactionSchema.parse(request.body);
    const result = await transactionService.createTransaction(body);

    return reply.code(201).send({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    return reply.code(500).send({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

export async function settleTransaction(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const { transactionId } = request.params as { transactionId: string };
    const result = await transactionService.settleTransaction(transactionId);

    return reply.code(200).send({
      success: true,
      data: result,
    });
  } catch (error) {
    return reply.code(500).send({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

export async function getTransaction(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { transactionId } = request.params as { transactionId: string };
  const result = await transactionService.getTransaction(transactionId);

  if (!result) {
    return {
      success: false,
      error: 'Transaction not found',
    };
  }

  return {
    success: true,
    data: result,
  };
}

export async function listTransactions(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const query = listTransactionsSchema.parse(request.query);

    const filters = {
      ...query,
      status: query.status as TransactionStatus | undefined,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    };

    const result = await transactionService.listTransactions(filters);

    return reply.code(200).send({
      success: true,
      data: result,
      count: result.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    return reply.code(500).send({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
