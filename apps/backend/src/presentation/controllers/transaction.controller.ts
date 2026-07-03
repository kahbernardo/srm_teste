import { FastifyRequest, FastifyReply } from 'fastify';
import { TransactionService } from '../../business/services/transaction.service';
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

export class TransactionController {
  async createTransaction(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const body = createTransactionSchema.parse(request.body);
      const result = await transactionService.createTransaction(body);

      reply.code(201).send({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      } else {
        reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error',
        });
      }
    }
  }

  async settleTransaction(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { transactionId } = request.params as { transactionId: string };
      const result = await transactionService.settleTransaction(transactionId);

      reply.code(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  async getTransaction(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { transactionId } = request.params as { transactionId: string };
      const result = await transactionService.getTransaction(transactionId);

      if (!result) {
        reply.code(404).send({
          success: false,
          error: 'Transaction not found',
        });
        return;
      }

      reply.code(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  async listTransactions(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const query = listTransactionsSchema.parse(request.query);

      const filters = {
        ...query,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
      };

      const result = await transactionService.listTransactions(filters);

      reply.code(200).send({
        success: true,
        data: result,
        count: result.length,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      } else {
        reply.code(500).send({
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error',
        });
      }
    }
  }
}
