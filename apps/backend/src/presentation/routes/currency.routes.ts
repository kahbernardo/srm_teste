import { FastifyInstance } from 'fastify';
import { CurrencyController } from '../controllers/currency.controller';

const currencyController = new CurrencyController();

export async function currencyRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/currencies',
    {
      schema: {
        description: 'List all currencies',
        tags: ['currencies'],
        querystring: {
          type: 'object',
          properties: {
            active: { type: 'boolean', default: true },
          },
        },
      },
    },
    currencyController.listCurrencies
  );

  fastify.get(
    '/currencies/:id',
    {
      schema: {
        description: 'Get currency by ID',
        tags: ['currencies'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    currencyController.getCurrency
  );

  fastify.get(
    '/currencies/code/:code',
    {
      schema: {
        description: 'Get currency by code (BRL, USD, etc)',
        tags: ['currencies'],
        params: {
          type: 'object',
          properties: {
            code: { type: 'string', pattern: '^[A-Z]{3}$' },
          },
        },
      },
    },
    currencyController.getCurrencyByCode
  );
}
