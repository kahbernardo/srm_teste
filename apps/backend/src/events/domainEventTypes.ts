export const DomainEventTypes = {
  TRANSACTION_CREATED: 'TransactionCreated',
  TRANSACTION_PRICED: 'TransactionPriced',
  TRANSACTION_SETTLED: 'TransactionSettled',
  EXCHANGE_RATE_UPDATED: 'ExchangeRateUpdated',
} as const;

export type DomainEventType = (typeof DomainEventTypes)[keyof typeof DomainEventTypes];

export interface DomainEventPayload {
  aggregateId: string;
  aggregateType: string;
  eventType: DomainEventType;
  payload: Record<string, unknown>;
  version?: number;
}
