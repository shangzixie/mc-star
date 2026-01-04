ALTER TABLE "warehouse_receipts"
ALTER COLUMN "customs_declaration_type" DROP NOT NULL;

ALTER TABLE "warehouse_receipts"
ALTER COLUMN "customs_declaration_type" DROP DEFAULT;


