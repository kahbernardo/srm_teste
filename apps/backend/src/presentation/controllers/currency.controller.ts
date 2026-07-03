import { FastifyRequest, FastifyReply } from 'fastify';
import { CurrencyService } from '../../business/services/currency.service';

const currencyService = new CurrencyService();

export class CurrencyController {
  async listCurrencies(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { active } = request.query as { active?: string };
      const activeOnly = active !== 'false';

      const currencies = await currencyService.listCurrencies(activeOnly);

      reply.code(200).send({
        success: true,
        data: currencies,
        count: currencies.length,
      });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  async getCurrency(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { id } = request.params as { id: string };
      const currency = await currencyService.getCurrency(id);

      if (!currency) {
        reply.code(404).send({
          success: false,
          error: 'Currency not found',
        });
        return;
      }

      reply.code(200).send({
        success: true,
        data: currency,
      });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  async getCurrencyByCode(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { code } = request.params as { code: string };
      const currency = await currencyService.getCurrencyByCode(code.toUpperCase());

      if (!currency) {
        reply.code(404).send({
          success: false,
          error: 'Currency not found',
        });
        return;
      }

      reply.code(200).send({
        success: true,
        data: currency,
      });
    } catch (error) {
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }
}
