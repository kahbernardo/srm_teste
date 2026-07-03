import { FastifyInstance } from 'fastify';
import { eventStore } from '../../events/eventStore';

export async function eventRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/events',
    {
      schema: {
        description: 'List recent domain events',
        tags: ['events'],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'integer', minimum: 1, maximum: 200 },
          },
        },
      },
    },
    async (request) => {
      const { limit } = request.query as { limit?: number };
      const events = await eventStore.getRecent(limit ?? 50);
      return { success: true, data: events };
    }
  );

  fastify.get(
    '/events/:aggregateId',
    {
      schema: {
        description: 'Get events for an aggregate',
        tags: ['events'],
        params: {
          type: 'object',
          properties: {
            aggregateId: { type: 'string', format: 'uuid' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            aggregateType: { type: 'string', default: 'Transaction' },
          },
        },
      },
    },
    async (request) => {
      const { aggregateId } = request.params as { aggregateId: string };
      const { aggregateType } = request.query as { aggregateType?: string };
      const events = await eventStore.getByAggregate(aggregateId, aggregateType ?? 'Transaction');
      return { success: true, data: events };
    }
  );
}
