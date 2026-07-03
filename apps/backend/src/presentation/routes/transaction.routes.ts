import { FastifyInstance } from 'fastify';
import { TransactionController } from '../controllers/transaction.controller';

const transactionController = new TransactionController();

export async function transactionRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/transactions',
    {
      schema: {
        description: 'Create a new transaction',
        tags: ['transactions'],
        body: {
          type: 'object',
          required: ['assetTypeId', 'currencyId', 'faceValue', 'daysToMaturity', 'createdBy'],
          properties: {
            externalReference: { type: 'string' },
            assetTypeId: { type: 'string', format: 'uuid' },
            currencyId: { type: 'string', format: 'uuid' },
            faceValue: { type: 'number', minimum: 0.01 },
            daysToMaturity: { type: 'integer', minimum: 1 },
            targetCurrencyId: { type: 'string', format: 'uuid' },
            createdBy: { type: 'string' },
          },
        },
        response: {
          201: {
            description: 'Transaction created successfully',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
            },
          },
        },
      },
    },
    transactionController.createTransaction
  );

  fastify.post(
    '/transactions/:transactionId/settle',
    {
      schema: {
        description: 'Settle a pending transaction',
        tags: ['transactions'],
        params: {
          type: 'object',
          properties: {
            transactionId: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            description: 'Transaction settled successfully',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
            },
          },
        },
      },
    },
    transactionController.settleTransaction
  );

  fastify.get(
    '/transactions/:transactionId',
    {
      schema: {
        description: 'Get transaction by ID',
        tags: ['transactions'],
        params: {
          type: 'object',
          properties: {
            transactionId: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            description: 'Transaction found',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
            },
          },
        },
      },
    },
    transactionController.getTransaction
  );

  fastify.get(
    '/transactions',
    {
      schema: {
        description: 'List transactions with filters',
        tags: ['transactions'],
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['PENDING', 'SETTLED', 'FAILED', 'CANCELLED'] },
            currencyId: { type: 'string', format: 'uuid' },
            assetTypeId: { type: 'string', format: 'uuid' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            limit: { type: 'integer', minimum: 1, maximum: 1000 },
          },
        },
        response: {
          200: {
            description: 'Transactions list',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'array' },
              count: { type: 'integer' },
            },
          },
        },
      },
    },
    transactionController.listTransactions
  );
}
