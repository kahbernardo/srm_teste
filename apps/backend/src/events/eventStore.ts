import { PrismaClient } from '@prisma/client';
import prisma from '../persistence/prisma-client';
import { DomainEventPayload } from './domainEventTypes';

export class EventStore {
  constructor(private readonly db: PrismaClient = prisma) {}

  async append(event: DomainEventPayload): Promise<void> {
    const payload =
      typeof event.payload === 'string' ? event.payload : JSON.stringify(event.payload);

    await this.db.domainEvent.create({
      data: {
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        eventType: event.eventType,
        payload,
        version: event.version ?? 1,
      },
    });
  }

  async getByAggregate(aggregateId: string, aggregateType: string) {
    return this.db.domainEvent.findMany({
      where: { aggregateId, aggregateType },
      orderBy: { occurredAt: 'asc' },
    });
  }

  async getRecent(limit = 50) {
    return this.db.domainEvent.findMany({
      orderBy: { occurredAt: 'desc' },
      take: limit,
    });
  }
}

export const eventStore = new EventStore();
