-- Add MBL/HBL numbers to bills of lading tables

ALTER TABLE "master_bills_of_lading"
ADD COLUMN IF NOT EXISTS "mbl_no" varchar(50);

CREATE INDEX IF NOT EXISTS "idx_mbl_mbl_no"
ON "master_bills_of_lading" USING btree ("mbl_no");

ALTER TABLE "house_bills_of_lading"
ADD COLUMN IF NOT EXISTS "hbl_no" varchar(50);

CREATE INDEX IF NOT EXISTS "idx_hbl_hbl_no"
ON "house_bills_of_lading" USING btree ("hbl_no");


