DO $$ BEGIN
  CREATE TYPE "public"."warehouse_receipt_customs_declaration_type" AS ENUM (
    'NO_DECLARATION',
    'BUY_ORDER',
    'FORMAL_DECLARATION'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "warehouse_receipts"
ADD COLUMN IF NOT EXISTS "customs_declaration_type" "warehouse_receipt_customs_declaration_type" NOT NULL DEFAULT 'NO_DECLARATION';

COMMENT ON COLUMN "warehouse_receipts"."customs_declaration_type" IS '报关类型';


