ALTER TABLE "warehouse_receipts"
  ADD COLUMN IF NOT EXISTS "air_type" varchar(20),
  ADD COLUMN IF NOT EXISTS "courier_tracking_no" varchar(120),
  ADD COLUMN IF NOT EXISTS "courier_received_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "customer_phone" varchar(50),
  ADD COLUMN IF NOT EXISTS "shipper_phone" varchar(50),
  ADD COLUMN IF NOT EXISTS "booking_agent_phone" varchar(50),
  ADD COLUMN IF NOT EXISTS "customs_agent_phone" varchar(50);
