import { Prisma, PrismaClient } from '@prisma/client';
import prisma from './prisma-client';

export interface AuditLogInput {
  entityType: string;
  entityId: string;
  action: string;
  changes: Record<string, unknown>;
  performedBy: string;
  ipAddress?: string;
}

export class AuditLogRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async create(
    input: AuditLogInput,
    tx: Prisma.TransactionClient = this.db
  ): Promise<void> {
    await tx.auditLog.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        changes: JSON.stringify(input.changes),
        performedBy: input.performedBy,
        ipAddress: input.ipAddress,
      },
    });
  }
}

export const auditLogRepository = new AuditLogRepository();
