-- Freight forwarding / warehouse outbound-loading relations
-- Source: scripts/build_relations.sql
-- This migration is intentionally idempotent to support databases created manually.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) Master data
CREATE TABLE IF NOT EXISTS parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE,
  name_cn TEXT NOT NULL,
  name_en TEXT,
  roles VARCHAR(20)[] NOT NULL,
  tax_no VARCHAR(50),
  contact_info JSONB DEFAULT '{}'::jsonb,
  address TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  un_locode CHAR(5) UNIQUE,
  name_cn TEXT NOT NULL,
  name_en TEXT,
  country_code CHAR(2),
  type VARCHAR(10) CHECK (type IN ('SEA', 'AIR', 'RAIL', 'ROAD')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  contact_person VARCHAR(100),
  phone VARCHAR(50),
  metadata JSONB DEFAULT '{}'::jsonb,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) Inbound & inventory
CREATE TABLE IF NOT EXISTS warehouse_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_no VARCHAR(30) UNIQUE NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id),
  customer_id UUID REFERENCES parties(id),
  status VARCHAR(20) DEFAULT 'RECEIVED',
  inbound_time TIMESTAMPTZ DEFAULT NOW(),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID REFERENCES warehouse_receipts(id) ON DELETE CASCADE,
  commodity_name TEXT,
  sku_code VARCHAR(50),
  initial_qty INTEGER NOT NULL,
  current_qty INTEGER NOT NULL,
  unit VARCHAR(10),
  bin_location VARCHAR(50),
  weight_total NUMERIC(12, 3),
  length_cm NUMERIC(12, 3),
  width_cm NUMERIC(12, 3),
  height_cm NUMERIC(12, 3),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3) Shipment core
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_no VARCHAR(30) UNIQUE NOT NULL,
  mbl_no VARCHAR(50),
  hbl_no VARCHAR(50),
  client_id UUID REFERENCES parties(id),
  shipper_id UUID REFERENCES parties(id),
  consignee_id UUID REFERENCES parties(id),
  agent_id UUID REFERENCES parties(id),
  carrier_id UUID REFERENCES parties(id),
  pol_id UUID REFERENCES locations(id),
  pod_id UUID REFERENCES locations(id),
  transport_mode VARCHAR(10) DEFAULT 'SEA',
  status VARCHAR(20) DEFAULT 'DRAFT',
  etd TIMESTAMPTZ,
  eta TIMESTAMPTZ,
  remarks TEXT,
  extra_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS containers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  container_no VARCHAR(11) UNIQUE,
  container_type VARCHAR(10),
  seal_no VARCHAR(50),
  vgm_weight NUMERIC(12, 3),
  tare_weight NUMERIC(12, 3),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4) Outbound allocations & movements
CREATE TABLE IF NOT EXISTS inventory_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  container_id UUID REFERENCES containers(id) ON DELETE SET NULL,
  allocated_qty INTEGER NOT NULL,
  picked_qty INTEGER NOT NULL DEFAULT 0,
  loaded_qty INTEGER NOT NULL DEFAULT 0,
  shipped_qty INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'ALLOCATED',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  ref_type VARCHAR(30) NOT NULL,
  ref_id UUID,
  qty_delta INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cargo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id UUID REFERENCES containers(id) ON DELETE CASCADE,
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  commodity_cn TEXT NOT NULL,
  commodity_en TEXT,
  hs_code VARCHAR(20),
  quantity INTEGER DEFAULT 1,
  unit VARCHAR(20),
  gross_weight NUMERIC(12, 3),
  volume NUMERIC(12, 3),
  marks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5) Attachments
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type VARCHAR(50),
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6) Indexes
CREATE INDEX IF NOT EXISTS idx_shipments_job_no ON shipments(job_no);
CREATE INDEX IF NOT EXISTS idx_shipments_mbl ON shipments(mbl_no);
CREATE INDEX IF NOT EXISTS idx_shipment_parties ON shipments(client_id, shipper_id, consignee_id);
CREATE INDEX IF NOT EXISTS idx_containers_shipment_id ON containers(shipment_id);
CREATE INDEX IF NOT EXISTS idx_cargo_shipment ON cargo_items(shipment_id);
CREATE INDEX IF NOT EXISTS idx_cargo_container_id ON cargo_items(container_id);
CREATE INDEX IF NOT EXISTS idx_attachments_shipment_id ON attachments(shipment_id);

CREATE INDEX IF NOT EXISTS idx_warehouse_receipts_warehouse ON warehouse_receipts(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_receipts_customer ON warehouse_receipts(customer_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_receipt ON inventory_items(receipt_id);

CREATE INDEX IF NOT EXISTS idx_alloc_inventory_item ON inventory_allocations(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_alloc_shipment ON inventory_allocations(shipment_id);
CREATE INDEX IF NOT EXISTS idx_alloc_container ON inventory_allocations(container_id);
CREATE INDEX IF NOT EXISTS idx_movements_inventory_item ON inventory_movements(inventory_item_id);


