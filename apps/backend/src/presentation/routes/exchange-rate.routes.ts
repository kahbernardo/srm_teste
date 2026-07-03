import { FastifyInstance } from 'fastify';
import { ExchangeRateController } from '../controllers/exchange-rate.controller';

const exchangeRateController = new ExchangeRateController();

export async function exchangeRateRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/exchange-rates',
    {
      schema: {
        description: 'List all current exchange rates',
        tags: ['exchange-rates'],
        querystring: {
          type: 'object',
          properties: {
            currencyId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    exchangeRateController.listExchangeRates
  );

  fastify.get(
    '/exchange-rates/current',
    {
      schema: {
        description: 'Get current exchange rate between two currencies',
        tags: ['exchange-rates'],
        querystring: {
          type: 'object',
          required: ['fromCurrencyId', 'toCurrencyId'],
          properties: {
            fromCurrencyId: { type: 'string', format: 'uuid' },
            toCurrencyId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    exchangeRateController.getCurrentRate
  );

  fastify.post(
    '/exchange-rates',
    {
      schema: {
        description: 'Create a new exchange rate',
        tags: ['exchange-rates'],
        body: {
          type: 'object',
          required: ['fromCurrencyId', 'toCurrencyId', 'rate', 'source'],
          properties: {
            fromCurrencyId: { type: 'string', format: 'uuid' },
            toCurrencyId: { type: 'string', format: 'uuid' },
            rate: { type: 'number', minimum: 0.000001 },
            source: { type: 'string' },
            validFrom: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    exchangeRateController.createExchangeRate
  );
}
