import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { querySettlementExtract } from '../../persistence/repositories/settlementExtract.repository';

const settlementExtractSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  cedente: z.string().min(1).optional(),
  currencyId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export async function getSettlementExtract(request: FastifyRequest, _reply: FastifyReply) {
  const query = settlementExtractSchema.parse(request.query);

  const result = await querySettlementExtract({
    startDate: query.startDate ? new Date(query.startDate) : undefined,
    endDate: query.endDate ? new Date(query.endDate) : undefined,
    cedente: query.cedente,
    currencyId: query.currencyId,
    page: query.page,
    pageSize: query.pageSize,
  });

  return {
    success: true,
    data: result.data,
    pagination: {
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    },
  };
}
