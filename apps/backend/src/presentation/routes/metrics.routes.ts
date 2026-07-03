import { FastifyInstance } from 'fastify';
import { renderMetrics } from '../../monitoring/metrics';

export async function metricsRoutes(fastify: FastifyInstance) {
  fastify.get('/metrics', async (_request, reply) => {
    reply.header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    return renderMetrics();
  });
}
