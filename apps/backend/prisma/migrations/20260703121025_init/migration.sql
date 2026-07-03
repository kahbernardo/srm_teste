-- CreateTable
CREATE TABLE "currencies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "from_currency_id" TEXT NOT NULL,
    "to_currency_id" TEXT NOT NULL,
    "rate" REAL NOT NULL,
    "valid_from" DATETIME NOT NULL,
    "valid_until" DATETIME,
    "source" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "exchange_rates_from_currency_id_fkey" FOREIGN KEY ("from_currency_id") REFERENCES "currencies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "exchange_rates_to_currency_id_fkey" FOREIGN KEY ("to_currency_id") REFERENCES "currencies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "asset_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "pricing_strategies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "asset_type_id" TEXT NOT NULL,
    "strategy_name" TEXT NOT NULL,
    "base_spread" REAL NOT NULL,
    "min_spread" REAL NOT NULL,
    "max_spread" REAL NOT NULL,
    "risk_multiplier" REAL NOT NULL,
    "valid_from" DATETIME NOT NULL,
    "valid_until" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "pricing_strategies_asset_type_id_fkey" FOREIGN KEY ("asset_type_id") REFERENCES "asset_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "external_reference" TEXT,
    "asset_type_id" TEXT NOT NULL,
    "currency_id" TEXT NOT NULL,
    "face_value" REAL NOT NULL,
    "days_to_maturity" INTEGER NOT NULL,
    "discount_rate" REAL NOT NULL,
    "discount_amount" REAL NOT NULL,
    "net_amount" REAL NOT NULL,
    "exchange_rate_applied" REAL,
    "converted_amount" REAL,
    "target_currency_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "settled_at" DATETIME,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "transactions_asset_type_id_fkey" FOREIGN KEY ("asset_type_id") REFERENCES "asset_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transactions_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currencies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" TEXT,
    "performed_by" TEXT NOT NULL,
    "performed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "currencies_code_key" ON "currencies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_from_currency_id_to_currency_id_valid_from_key" ON "exchange_rates"("from_currency_id", "to_currency_id", "valid_from");

-- CreateIndex
CREATE UNIQUE INDEX "asset_types_code_key" ON "asset_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_strategies_asset_type_id_valid_from_key" ON "pricing_strategies"("asset_type_id", "valid_from");
