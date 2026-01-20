ALTER TABLE warehouse_receipts
  ADD COLUMN sea_carrier VARCHAR(200),
  ADD COLUMN sea_route VARCHAR(200),
  ADD COLUMN sea_vessel_name VARCHAR(200),
  ADD COLUMN sea_voyage VARCHAR(200);

ALTER TABLE warehouse_receipts
  DROP COLUMN sea_carrier_route,
  DROP COLUMN sea_vessel_voyage;
