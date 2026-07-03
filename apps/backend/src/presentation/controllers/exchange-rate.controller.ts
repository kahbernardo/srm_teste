import { FastifyRequest, FastifyReply } from 'fastify';
import { ExchangeRateService } from '../../business/services/exchange-rate.service';
import { z } from 'zod';

const exchangeRateService = new ExchangeRateService();

const createExchangeRateSchema = z.object({
  fromCurrencyId: z.string().uuid(),
  toCurrencyId: z.string().uuid(),
  rate: z.number().positive(),
  source: z.string(),
  validFrom: z.string().datetime().optional(),
});

export class ExchangeRateController {
  async getCurrentRate(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { fromCurrencyId, toCurrencyId } = request.query as {
        fromCurrencyId: string;
        toCurrencyId: string;
      };

      if (!fromCurrencyId || !toCurrencyId) {
        reply.code(400).send({
          success: false,
          error: 'Both fromCurrencyId and toCurrencyId are required',
        });
        return;
      }

      const rate = await exchangeRateService.getCurrentRate(
        fromCurrencyId,
        toCurrencyId
      );

      if (!rate) {
        reply.code(404).send({
          success: false,
          error: 'Exchange rate not found',
        });
        return;
      }

      reply.code(200).send({
        success: true,
        data: rate,
      });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  async createExchangeRate(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const body = createExchangeRateSchema.parse(request.body);

      const rate = await exchangeRateService.createExchangeRate({
        ...body,
        validFrom: body.validFrom ? new Date(body.validFrom) : undefined,
      });

      reply.code(201).send({
        success: true,
        data: rate,
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

  async listExchangeRates(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { currencyId } = request.query as { currencyId?: string };

      const rates = await exchangeRateService.listExchangeRates(currencyId);

      reply.code(200).send({
        success: true,
        data: rates,
        count: rates.length,
      });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }
}
