ALTER TABLE "master_bills_of_lading"
  ADD COLUMN IF NOT EXISTS "port_of_destination_address" text;
