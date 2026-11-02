CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  nickname TEXT,
  consent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ;
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

ALTER TABLE users ADD COLUMN IF NOT EXISTS bonus_balance NUMERIC(14, 2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS promo_codes (
  code VARCHAR(32) PRIMARY KEY,
  percent INTEGER NOT NULL CHECK (percent BETWEEN 1 AND 100),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  secret_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS admin_sessions_expires_at_idx ON admin_sessions(expires_at);

-- Account controls and indicative catalog prices. Actual checkout is not implemented.
ALTER TABLE users ADD COLUMN IF NOT EXISTS purchase_blocked BOOLEAN NOT NULL DEFAULT FALSE;
CREATE TABLE IF NOT EXISTS catalog_prices (
  product_name TEXT PRIMARY KEY,
  price_rub NUMERIC(12, 2) CHECK (price_rub IS NULL OR price_rub >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Confirmed payments only. The payment integration must insert one row per paid order.
CREATE TABLE IF NOT EXISTS sales_orders (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rub_amount NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (rub_amount >= 0),
  bonus_amount NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (bonus_amount >= 0),
  CHECK (rub_amount > 0 OR bonus_amount > 0)
);
CREATE INDEX IF NOT EXISTS sales_orders_paid_at_idx ON sales_orders(paid_at);
