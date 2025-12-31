-- Supabase / PostgreSQL schema for REI-DO-PIRARUCU
-- Creates tables to store customers, sales, payments, purchases, stock and movements

-- Enable pgcrypto for UUID generation (Supabase supports this extension)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tax_id TEXT,
  address TEXT,
  contact_person TEXT,
  phone TEXT,
  wallet_balance NUMERIC DEFAULT 0,
  credit_limit NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Customer-specific price list (optional custom prices per product)
CREATE TABLE IF NOT EXISTS customer_price_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  UNIQUE(customer_id, product_name)
);

-- Stock items
CREATE TABLE IF NOT EXISTS stock_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL UNIQUE,
  available_weight NUMERIC DEFAULT 0,
  base_price_per_kg NUMERIC DEFAULT 0,
  last_update TIMESTAMPTZ DEFAULT now()
);

-- Stock movements / history
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_item_id UUID REFERENCES stock_items(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('entry','exit','adjustment')) NOT NULL,
  weight NUMERIC,
  occurred_at TIMESTAMPTZ DEFAULT now(),
  description TEXT
);

-- Purchases (entries of incoming stock/costs)
CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  product_name TEXT,
  weight_kg NUMERIC,
  price_per_kg NUMERIC,
  total NUMERIC,
  date DATE,
  supplier TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sales (customer entries)
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
  product_name TEXT,
  price_per_kg NUMERIC,
  weight_kg NUMERIC,
  total NUMERIC,
  date DATE,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  paid_amount NUMERIC,
  is_dispatched BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Payment records related to a sale (can store partial payments)
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id TEXT REFERENCES sales(id) ON DELETE CASCADE,
  occurred_at TIMESTAMPTZ DEFAULT now(),
  amount NUMERIC NOT NULL,
  method TEXT
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(date);
CREATE INDEX IF NOT EXISTS idx_stock_name ON stock_items(product_name);

-- SEEDS: product suggestions (initial stock items with zero quantity)
INSERT INTO stock_items (product_name, available_weight, base_price_per_kg)
SELECT v, 0, 0
FROM (VALUES
  ('FILE PIRARUCU'),
  ('LINGUIÇA PIRARUCU'),
  ('TAMBAQUI EM BANDAS'),
  ('LOMBO'),
  ('POSTA PINTADO'),
  ('TAMBAQUI SEM ESPINHO'),
  ('FILE DE LAMBARI'),
  ('COSTELINHA TAMBAQUI'),
  ('BANDA DE TAMBAQUI'),
  ('FITA'),
  ('KIBE DE PIRARUCU'),
  ('FRETE'),
  ('CAIXA'),
  ('DEPOSITO')
) AS t(v)
ON CONFLICT (product_name) DO NOTHING;

-- SEEDS: initial customers and their sales (from constants.tsx)
-- Customer 1
INSERT INTO customers (id, name, wallet_balance, credit_limit)
VALUES ('1', 'MISTURAS IG PVH', 0, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO sales (id, customer_id, product_name, price_per_kg, weight_kg, total, date, is_paid)
VALUES
('e1', '1', 'FILE PIRARUCU', 22.15, 26, 575.9, '2025-12-06', TRUE),
('e2', '1', 'LINGUIÇA PIRARUCU', 12.3, 24, 295.2, '2025-12-06', FALSE),
('e3', '1', 'TAMBAQUI EM BANDAS', 15.5, 32, 496, '2025-12-06', FALSE)
ON CONFLICT (id) DO NOTHING;

-- add payment for e1
INSERT INTO payment_records (sale_id, amount, method, occurred_at)
VALUES ('e1', 575.9, 'CASH', '2025-12-06')
ON CONFLICT DO NOTHING;

-- Customer 2
INSERT INTO customers (id, name, wallet_balance, credit_limit)
VALUES ('2', 'FELIPE', 0, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO sales (id, customer_id, product_name, price_per_kg, weight_kg, total, date, is_paid)
VALUES ('e4', '2', 'LOMBO', 38, 700, 26600, '2025-12-06', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO payment_records (sale_id, amount, method, occurred_at)
VALUES ('e4', 26600, 'CASH', '2025-12-06')
ON CONFLICT DO NOTHING;

-- Customer 3
INSERT INTO customers (id, name, wallet_balance, credit_limit)
VALUES ('3', 'NOVA ERA', 0, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO sales (id, customer_id, product_name, price_per_kg, weight_kg, total, date, is_paid)
VALUES ('e5', '3', 'FILE PIRARUCU', 105, 24, 2520, '2025-12-15', FALSE)
ON CONFLICT (id) DO NOTHING;

-- End of schema and seeds
