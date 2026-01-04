DO $$ BEGIN
  CREATE TYPE "public"."warehouse_receipt_transport_type" AS ENUM (
    'SEA_FCL',
    'AIR_FREIGHT',
    'SEA_LCL',
    'DOMESTIC_TRANSPORT',
    'WAREHOUSING',
    'ROAD_FTL',
    'ROAD_LTL',
    'EXPRESS_LINEHAUL',
    'FBA_SEA',
    'FBA_AIR',
    'FBA_RAIL',
    'BULK_CARGO',
    'RAIL_FREIGHT'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "warehouse_receipts"
ADD COLUMN IF NOT EXISTS "transport_type" "warehouse_receipt_transport_type";

COMMENT ON COLUMN "warehouse_receipts"."transport_type" IS '运输类型';


