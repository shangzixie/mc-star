-- Create house_bills_of_lading table with one-to-one relationship to warehouse_receipts
CREATE TABLE IF NOT EXISTS "house_bills_of_lading" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"receipt_id" uuid NOT NULL UNIQUE,
	"port_of_destination_id" uuid,
	"port_of_discharge_id" uuid,
	"port_of_loading_id" uuid,
	"place_of_receipt_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "house_bills_of_lading_receipt_id_warehouse_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "warehouse_receipts"("id") ON DELETE CASCADE,
	CONSTRAINT "house_bills_of_lading_port_of_destination_id_transport_nodes_id_fk" FOREIGN KEY ("port_of_destination_id") REFERENCES "transport_nodes"("id") ON DELETE SET NULL,
	CONSTRAINT "house_bills_of_lading_port_of_discharge_id_transport_nodes_id_fk" FOREIGN KEY ("port_of_discharge_id") REFERENCES "transport_nodes"("id") ON DELETE SET NULL,
	CONSTRAINT "house_bills_of_lading_port_of_loading_id_transport_nodes_id_fk" FOREIGN KEY ("port_of_loading_id") REFERENCES "transport_nodes"("id") ON DELETE SET NULL,
	CONSTRAINT "house_bills_of_lading_place_of_receipt_id_transport_nodes_id_fk" FOREIGN KEY ("place_of_receipt_id") REFERENCES "transport_nodes"("id") ON DELETE SET NULL
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS "idx_hbl_receipt_id" ON "house_bills_of_lading" USING btree ("receipt_id");
CREATE INDEX IF NOT EXISTS "idx_hbl_port_of_destination_id" ON "house_bills_of_lading" USING btree ("port_of_destination_id");
CREATE INDEX IF NOT EXISTS "idx_hbl_port_of_discharge_id" ON "house_bills_of_lading" USING btree ("port_of_discharge_id");
CREATE INDEX IF NOT EXISTS "idx_hbl_port_of_loading_id" ON "house_bills_of_lading" USING btree ("port_of_loading_id");
CREATE INDEX IF NOT EXISTS "idx_hbl_place_of_receipt_id" ON "house_bills_of_lading" USING btree ("place_of_receipt_id");


