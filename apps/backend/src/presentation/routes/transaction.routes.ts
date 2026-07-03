import { FastifyInstance } from 'fastify';
import * as TransactionController from '../controllers/transaction.controller.final';

export async function transactionRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/transactions/simulate',
    {
      schema: {
        description: 'Simulate transaction pricing without persisting',
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
      },
    },
    TransactionController.simulateTransaction
  );

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
        // Response schema removed to allow full serialization
        // response: {
        //   201: {
        //     description: 'Transaction created successfully',
        //     type: 'object',
        //     properties: {
        //       success: { type: 'boolean' },
        //       data: { type: 'object' },
        //     },
        //   },
        // },
      },
    },
    TransactionController.createTransaction
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
    TransactionController.settleTransaction
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
    TransactionController.getTransaction
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
            page: { type: 'integer', minimum: 1 },
            pageSize: { type: 'integer', minimum: 1, maximum: 100 },
          },
        },
        response: {
          200: {
            description: 'Transactions list',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'array' },
              pagination: { type: 'object' },
            },
          },
        },
      },
    },
    TransactionController.listTransactions
  );
}
