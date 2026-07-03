type LabelValues = Record<string, string | number>;

class Counter {
  private values = new Map<string, number>();

  constructor(private readonly name: string, private readonly labelNames: string[]) {}

  inc(labels: LabelValues = {}, value = 1) {
    const key = this.serialize(labels);
    this.values.set(key, (this.values.get(key) ?? 0) + value);
  }

  collect(): string {
    const lines: string[] = [`# TYPE ${this.name} counter`];
    for (const [key, value] of this.values) {
      lines.push(`${this.name}${key} ${value}`);
    }
    return lines.join('\n');
  }

  private serialize(labels: LabelValues): string {
    if (this.labelNames.length === 0) return '';
    const parts = this.labelNames.map((n) => `${n}="${labels[n] ?? ''}"`);
    return `{${parts.join(',')}}`;
  }
}

class Histogram {
  private buckets: number[];
  private counts = new Map<string, number[]>();
  private sums = new Map<string, number>();
  private totals = new Map<string, number>();

  constructor(
    private readonly name: string,
    private readonly labelNames: string[],
    bucketValues: number[] = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
  ) {
    this.buckets = [...bucketValues, Infinity];
  }

  observe(labels: LabelValues, value: number) {
    const key = this.serialize(labels);
    if (!this.counts.has(key)) {
      this.counts.set(key, new Array(this.buckets.length).fill(0));
      this.sums.set(key, 0);
      this.totals.set(key, 0);
    }
    const counts = this.counts.get(key)!;
    for (let i = 0; i < this.buckets.length; i++) {
      if (value <= this.buckets[i]) counts[i]++;
    }
    this.sums.set(key, (this.sums.get(key) ?? 0) + value);
    this.totals.set(key, (this.totals.get(key) ?? 0) + 1);
  }

  collect(): string {
    const lines: string[] = [`# TYPE ${this.name} histogram`];
    for (const [key, counts] of this.counts) {
      for (let i = 0; i < this.buckets.length; i++) {
        const le = this.buckets[i] === Infinity ? '+Inf' : String(this.buckets[i]);
        lines.push(`${this.name}_bucket${key}{le="${le}"} ${counts[i]}`);
      }
      lines.push(`${this.name}_sum${key} ${this.sums.get(key) ?? 0}`);
      lines.push(`${this.name}_count${key} ${this.totals.get(key) ?? 0}`);
    }
    return lines.join('\n');
  }

  private serialize(labels: LabelValues): string {
    if (this.labelNames.length === 0) return '';
    const parts = this.labelNames.map((n) => `${n}="${labels[n] ?? ''}"`);
    return `{${parts.join(',')}}`;
  }
}

class Gauge {
  private values = new Map<string, number>();

  constructor(private readonly name: string, private readonly labelNames: string[]) {}

  set(labels: LabelValues, value: number) {
    this.values.set(this.serialize(labels), value);
  }

  collect(): string {
    const lines: string[] = [`# TYPE ${this.name} gauge`];
    for (const [key, value] of this.values) {
      lines.push(`${this.name}${key} ${value}`);
    }
    return lines.join('\n');
  }

  private serialize(labels: LabelValues): string {
    if (this.labelNames.length === 0) return '';
    const parts = this.labelNames.map((n) => `${n}="${labels[n] ?? ''}"`);
    return `{${parts.join(',')}}`;
  }
}

export const metrics = {
  transactionsTotal: new Counter('srm_transactions_total', ['status', 'currency', 'asset_type']),
  transactionValue: new Histogram('srm_transaction_value', ['currency'], [100, 1000, 10000, 100000, 1000000]),
  pricingDuration: new Histogram('srm_pricing_calculation_duration_seconds', ['strategy'], [
    0.001, 0.005, 0.01, 0.05, 0.1,
  ]),
  exchangeRateAge: new Gauge('srm_exchange_rate_age_seconds', ['from_currency', 'to_currency']),
  httpRequestsTotal: new Counter('srm_http_requests_total', ['method', 'route', 'status']),
};

export function renderMetrics(): string {
  return [
    metrics.transactionsTotal.collect(),
    metrics.transactionValue.collect(),
    metrics.pricingDuration.collect(),
    metrics.exchangeRateAge.collect(),
    metrics.httpRequestsTotal.collect(),
  ].join('\n');
}
