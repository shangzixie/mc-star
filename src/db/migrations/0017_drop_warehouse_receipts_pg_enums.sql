-- Drop Postgres ENUM usage for warehouse receipts.
-- We store enum *codes* as varchar and validate in the application layer.

ALTER TABLE "warehouse_receipts"
  ALTER COLUMN "transport_type" TYPE varchar(30)
  USING "transport_type"::text;

ALTER TABLE "warehouse_receipts"
  ALTER COLUMN "customs_declaration_type" TYPE varchar(30)
  USING "customs_declaration_type"::text;

DROP TYPE IF EXISTS "public"."warehouse_receipt_transport_type";
DROP TYPE IF EXISTS "public"."warehouse_receipt_customs_declaration_type";


