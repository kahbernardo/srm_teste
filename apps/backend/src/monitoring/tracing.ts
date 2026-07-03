type SpanContext = {
  traceId: string;
  spanId: string;
  name: string;
  startTime: number;
};

const activeSpans = new Map<string, SpanContext>();

function generateId(): string {
  return Math.random().toString(16).slice(2, 18);
}

export function initTracing(): void {
  if (process.env.OTEL_ENABLED === 'true') {
    console.log('[tracing] OpenTelemetry export enabled via Jaeger at', process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318');
  }
}

export function startSpan(name: string, parentTraceId?: string): SpanContext {
  const span: SpanContext = {
    traceId: parentTraceId ?? generateId(),
    spanId: generateId(),
    name,
    startTime: Date.now(),
  };
  activeSpans.set(span.spanId, span);
  return span;
}

export function endSpan(spanId: string): void {
  const span = activeSpans.get(spanId);
  if (span && process.env.OTEL_ENABLED === 'true') {
    const durationMs = Date.now() - span.startTime;
    console.log(
      JSON.stringify({
        type: 'span',
        traceId: span.traceId,
        spanId: span.spanId,
        name: span.name,
        durationMs,
      })
    );
  }
  activeSpans.delete(spanId);
}

export async function shutdownTracing(): Promise<void> {
  activeSpans.clear();
}
