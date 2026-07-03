import { Decimal } from '@prisma/client/runtime/library';

export function serializeForResponse<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (value instanceof Decimal) return value.toNumber() as T;
  if (typeof value === 'bigint') return Number(value) as T;
  if (value instanceof Date) return value.toISOString() as T;
  if (Array.isArray(value)) return value.map((item) => serializeForResponse(item)) as T;
  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      result[key] = serializeForResponse(entry);
    }
    return result as T;
  }
  return value;
}
