-- Create master_bills_of_lading table with one-to-one relationship to warehouse_receipts
CREATE TABLE IF NOT EXISTS "master_bills_of_lading" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"receipt_id" uuid NOT NULL UNIQUE,
	"port_of_destination" text,
	"country_of_destination" varchar(100),
	"port_of_discharge" text,
	"port_of_loading" text,
	"place_of_receipt" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "master_bills_of_lading_receipt_id_warehouse_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "warehouse_receipts"("id") ON DELETE CASCADE
);

-- Create index on receipt_id for faster lookups
CREATE INDEX IF NOT EXISTS "idx_mbl_receipt_id" ON "master_bills_of_lading" USING btree ("receipt_id");

