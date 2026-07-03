-- SRM Credit Engine — PostgreSQL DDL
-- Gerado a partir do schema Prisma (schema.prisma.postgres)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE transaction_status AS ENUM ('PENDING', 'SETTLED', 'FAILED', 'CANCELLED');

CREATE TABLE currencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(3) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(5) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency_id UUID NOT NULL REFERENCES currencies(id),
    to_currency_id UUID NOT NULL REFERENCES currencies(id),
    rate NUMERIC(18, 6) NOT NULL,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ,
    source VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL,
    UNIQUE (from_currency_id, to_currency_id, valid_from)
);

CREATE INDEX exchange_rates_valid_from_valid_until_idx ON exchange_rates(valid_from, valid_until);

CREATE TABLE asset_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE pricing_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_type_id UUID NOT NULL REFERENCES asset_types(id),
    strategy_name VARCHAR(100) NOT NULL,
    base_spread NUMERIC(8, 6) NOT NULL,
    min_spread NUMERIC(8, 6) NOT NULL,
    max_spread NUMERIC(8, 6) NOT NULL,
    risk_multiplier NUMERIC(5, 3) NOT NULL,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL,
    UNIQUE (asset_type_id, valid_from)
);

CREATE INDEX pricing_strategies_valid_from_valid_until_idx ON pricing_strategies(valid_from, valid_until);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_reference VARCHAR(100),
    asset_type_id UUID NOT NULL REFERENCES asset_types(id),
    currency_id UUID NOT NULL REFERENCES currencies(id),
    face_value NUMERIC(18, 2) NOT NULL,
    days_to_maturity INTEGER NOT NULL,
    discount_rate NUMERIC(8, 6) NOT NULL,
    discount_amount NUMERIC(18, 2) NOT NULL,
    net_amount NUMERIC(18, 2) NOT NULL,
    exchange_rate_applied NUMERIC(18, 6),
    converted_amount NUMERIC(18, 2),
    target_currency_id UUID,
    status transaction_status NOT NULL DEFAULT 'PENDING',
    settled_at TIMESTAMPTZ,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL,
    version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX transactions_status_settled_at_idx ON transactions(status, settled_at);
CREATE INDEX transactions_created_at_idx ON transactions(created_at);
CREATE INDEX transactions_external_reference_idx ON transactions(external_reference);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,
    changes JSONB,
    performed_by VARCHAR(100) NOT NULL,
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(45)
);

CREATE INDEX audit_logs_entity_type_entity_id_idx ON audit_logs(entity_type, entity_id);
CREATE INDEX audit_logs_performed_at_idx ON audit_logs(performed_at);

CREATE TABLE domain_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX domain_events_aggregate_id_aggregate_type_idx ON domain_events(aggregate_id, aggregate_type);
CREATE INDEX domain_events_occurred_at_idx ON domain_events(occurred_at);
