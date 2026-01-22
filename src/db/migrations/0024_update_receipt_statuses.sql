-- Update warehouse receipts status enum values from RECEIVED/SHIPPED/PARTIAL to INBOUND/OUTBOUND/VOID
-- This migration updates:
-- 1. All existing RECEIVED statuses to INBOUND
-- 2. All existing SHIPPED statuses to OUTBOUND
-- 3. All existing PARTIAL statuses to OUTBOUND (partial shipments are considered outbound)
-- 4. Updates the default value for new records

-- Update existing records
UPDATE "warehouse_receipts" SET "status" = 'INBOUND' WHERE "status" = 'RECEIVED';
UPDATE "warehouse_receipts" SET "status" = 'OUTBOUND' WHERE "status" IN ('SHIPPED', 'PARTIAL');
