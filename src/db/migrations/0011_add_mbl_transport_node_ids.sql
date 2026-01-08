ALTER TABLE "master_bills_of_lading"
ADD COLUMN IF NOT EXISTS "port_of_destination_id" uuid,
ADD COLUMN IF NOT EXISTS "port_of_discharge_id" uuid,
ADD COLUMN IF NOT EXISTS "port_of_loading_id" uuid,
ADD COLUMN IF NOT EXISTS "place_of_receipt_id" uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'mbl_port_of_destination_id_transport_nodes_id_fk'
  ) THEN
    ALTER TABLE "master_bills_of_lading"
    ADD CONSTRAINT "mbl_port_of_destination_id_transport_nodes_id_fk"
    FOREIGN KEY ("port_of_destination_id")
    REFERENCES "public"."transport_nodes"("id")
    ON DELETE set null
    ON UPDATE no action;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'mbl_port_of_discharge_id_transport_nodes_id_fk'
  ) THEN
    ALTER TABLE "master_bills_of_lading"
    ADD CONSTRAINT "mbl_port_of_discharge_id_transport_nodes_id_fk"
    FOREIGN KEY ("port_of_discharge_id")
    REFERENCES "public"."transport_nodes"("id")
    ON DELETE set null
    ON UPDATE no action;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'mbl_port_of_loading_id_transport_nodes_id_fk'
  ) THEN
    ALTER TABLE "master_bills_of_lading"
    ADD CONSTRAINT "mbl_port_of_loading_id_transport_nodes_id_fk"
    FOREIGN KEY ("port_of_loading_id")
    REFERENCES "public"."transport_nodes"("id")
    ON DELETE set null
    ON UPDATE no action;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'mbl_place_of_receipt_id_transport_nodes_id_fk'
  ) THEN
    ALTER TABLE "master_bills_of_lading"
    ADD CONSTRAINT "mbl_place_of_receipt_id_transport_nodes_id_fk"
    FOREIGN KEY ("place_of_receipt_id")
    REFERENCES "public"."transport_nodes"("id")
    ON DELETE set null
    ON UPDATE no action;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_mbl_port_of_destination_id" ON "master_bills_of_lading" USING btree ("port_of_destination_id");
CREATE INDEX IF NOT EXISTS "idx_mbl_port_of_discharge_id" ON "master_bills_of_lading" USING btree ("port_of_discharge_id");
CREATE INDEX IF NOT EXISTS "idx_mbl_port_of_loading_id" ON "master_bills_of_lading" USING btree ("port_of_loading_id");
CREATE INDEX IF NOT EXISTS "idx_mbl_place_of_receipt_id" ON "master_bills_of_lading" USING btree ("place_of_receipt_id");


