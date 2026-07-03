import { FastifyInstance } from 'fastify';
import { getSettlementExtract } from '../controllers/report.controller';

export async function reportRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/reports/settlement-extract',
    {
      schema: {
        description: 'Settlement extract with native SQL for analytical queries',
        tags: ['reports'],
        querystring: {
          type: 'object',
          properties: {
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            cedente: { type: 'string' },
            currencyId: { type: 'string', format: 'uuid' },
            page: { type: 'integer', minimum: 1 },
            pageSize: { type: 'integer', minimum: 1, maximum: 100 },
          },
        },
        response: {
          200: {
            description: 'Settlement extract rows',
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
    getSettlementExtract
  );
}
