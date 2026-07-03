import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { transactionRoutes } from './presentation/routes/transaction.routes';
import { currencyRoutes } from './presentation/routes/currency.routes';
import { assetTypeRoutes } from './presentation/routes/asset-type.routes';
import { exchangeRateRoutes } from './presentation/routes/exchange-rate.routes';
import { eventRoutes } from './presentation/routes/event.routes';
import { metricsRoutes } from './presentation/routes/metrics.routes';
import { errorHandler } from './presentation/middlewares/error-handler';
import { metrics } from './monitoring/metrics';
import { initTracing, shutdownTracing } from './monitoring/tracing';
import prisma from './persistence/prisma-client';

initTracing();

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
});

async function start() {
  try {
    // Global error handler
    server.setErrorHandler(errorHandler);

    // Security middleware
    await server.register(helmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
    });

    // CORS configuration
    await server.register(cors, {
      origin:
        process.env.ALLOWED_ORIGINS?.split(',') || [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:3002',
          'http://localhost:3003',
        ],
      credentials: true,
    });

    // Rate limiting
    await server.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
    });

    // Swagger documentation
    await server.register(swagger, {
      swagger: {
        info: {
          title: 'SRM Credit Engine API',
          description: 'API for credit assignment and settlement operations',
          version: '0.1.0',
        },
        host: `localhost:${process.env.PORT || 4000}`,
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json'],
        tags: [
          { name: 'transactions', description: 'Transaction operations' },
          { name: 'currencies', description: 'Currency management' },
          { name: 'asset-types', description: 'Asset type management' },
          { name: 'exchange-rates', description: 'Exchange rate management' },
          { name: 'health', description: 'Health check endpoints' },
        ],
      },
    });

    await server.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
      },
      staticCSP: true,
    });

    // Health check routes
    server.get('/health', async () => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }));

    server.get('/health/ready', async () => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        return {
          status: 'ready',
          timestamp: new Date().toISOString(),
          database: 'connected',
        };
      } catch (error) {
        return {
          status: 'not ready',
          timestamp: new Date().toISOString(),
          database: 'disconnected',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    // Root route
    server.get('/', async () => ({
      name: 'SRM Credit Engine API',
      version: '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      documentation: '/docs',
    }));

    // Debug endpoint
    server.get('/debug-json', async () => ({
      success: true,
      data: {
        id: 'test-123',
        value: 100.50,
        name: 'Test',
      },
    }));

    // Debug service call
    server.get('/debug-service', async () => {
      const { TransactionService } = await import('./business/services/transaction.service');
      const service = new TransactionService();

      const result = await service.createTransaction({
        externalReference: 'DEBUG-SERVICE',
        assetTypeId: '6f943a9f-8689-4b0a-9eb1-d8a021b1a8f3',
        currencyId: '50fd2523-2dd8-459b-8328-aedfb568c70f',
        faceValue: 10000,
        daysToMaturity: 30,
        createdBy: 'debug',
      });

      return {
        success: true,
        data: result,
      };
    });

    // Debug get transaction
    server.get('/debug-get/:id', async (request: any) => {
      const { TransactionService } = await import('./business/services/transaction.service');
      const service = new TransactionService();
      const result = await service.getTransaction(request.params.id);

      return {
        success: true,
        data: result,
      };
    });

    // Register API routes
    await server.register(transactionRoutes, { prefix: '/api/v1' });
    await server.register(currencyRoutes, { prefix: '/api/v1' });
    await server.register(assetTypeRoutes, { prefix: '/api/v1' });
    await server.register(exchangeRateRoutes, { prefix: '/api/v1' });
    await server.register(eventRoutes, { prefix: '/api/v1' });
    await server.register(metricsRoutes);

    server.addHook('onResponse', async (request, reply) => {
      const route = request.routeOptions?.url ?? request.url;
      metrics.httpRequestsTotal.inc({
        method: request.method,
        route,
        status: reply.statusCode,
      });
    });

    const port = parseInt(process.env.PORT || '4000', 10);
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });

    console.log(`🚀 Server ready at http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach(signal => {
  process.on(signal, async () => {
    server.log.info(`Received ${signal}, closing server...`);
    await shutdownTracing();
    await server.close();
    process.exit(0);
  });
});

start();
