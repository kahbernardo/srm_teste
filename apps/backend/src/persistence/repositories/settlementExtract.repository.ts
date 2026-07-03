import { PrismaClient } from '@prisma/client';
import prisma from '../prisma-client';

export interface SettlementExtractFilters {
  startDate?: Date;
  endDate?: Date;
  cedente?: string;
  currencyId?: string;
  page?: number;
  pageSize?: number;
}

export interface SettlementExtractRow {
  id: string;
  external_reference: string | null;
  face_value: number;
  discount_amount: number;
  net_amount: number;
  converted_amount: number | null;
  settled_at: Date | null;
  created_by: string;
  created_at: Date;
  asset_code: string;
  asset_name: string;
  currency_code: string;
  currency_symbol: string;
}

export interface SettlementExtractResult {
  data: SettlementExtractRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function isPostgresDatabase(): boolean {
  const url = process.env.DATABASE_URL ?? '';
  return url.includes('postgres');
}

function buildWhereClause(
  filters: SettlementExtractFilters,
  postgres: boolean
): { clause: string; params: unknown[] } {
  const params: unknown[] = [];
  const parts: string[] = [
    postgres ? `t.status::text = 'SETTLED'` : `t.status = 'SETTLED'`,
  ];

  if (filters.startDate) {
    params.push(filters.startDate);
    parts.push(`t.settled_at >= $${params.length}`);
  }
  if (filters.endDate) {
    params.push(filters.endDate);
    parts.push(`t.settled_at <= $${params.length}`);
  }
  if (filters.cedente) {
    params.push(filters.cedente);
    parts.push(`t.created_by = $${params.length}`);
  }
  if (filters.currencyId) {
    params.push(filters.currencyId);
    parts.push(`t.currency_id = $${params.length}`);
  }

  return { clause: parts.join(' AND '), params };
}

export async function querySettlementExtract(
  filters: SettlementExtractFilters,
  db: PrismaClient = prisma
): Promise<SettlementExtractResult> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const offset = (page - 1) * pageSize;
  const postgres = isPostgresDatabase();
  const { clause, params } = buildWhereClause(filters, postgres);

  const countRows = await db.$queryRawUnsafe<[{ count: bigint | number }]>(
    `SELECT COUNT(*) AS count FROM transactions t WHERE ${clause}`,
    ...params
  );

  const total = Number(countRows[0]?.count ?? 0);

  const data = await db.$queryRawUnsafe<SettlementExtractRow[]>(
    `SELECT
      t.id,
      t.external_reference,
      t.face_value,
      t.discount_amount,
      t.net_amount,
      t.converted_amount,
      t.settled_at,
      t.created_by,
      t.created_at,
      at.code AS asset_code,
      at.name AS asset_name,
      c.code AS currency_code,
      c.symbol AS currency_symbol
    FROM transactions t
    INNER JOIN asset_types at ON at.id = t.asset_type_id
    INNER JOIN currencies c ON c.id = t.currency_id
    WHERE ${clause}
    ORDER BY t.settled_at DESC, t.created_at DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    ...params,
    pageSize,
    offset
  );

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}
