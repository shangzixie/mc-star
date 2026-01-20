ALTER TABLE warehouse_receipts
  ADD COLUMN manual_pieces numeric(12, 3),
  ADD COLUMN manual_weight_kg numeric(12, 3),
  ADD COLUMN manual_volume_m3 numeric(12, 3),
  ADD COLUMN bubble_split_percent numeric(6, 2);
