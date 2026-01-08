ALTER TABLE "master_bills_of_lading"
  DROP COLUMN IF EXISTS "port_of_destination",
  DROP COLUMN IF EXISTS "port_of_discharge",
  DROP COLUMN IF EXISTS "port_of_loading",
  DROP COLUMN IF EXISTS "place_of_receipt",
  DROP COLUMN IF EXISTS "country_of_destination";


