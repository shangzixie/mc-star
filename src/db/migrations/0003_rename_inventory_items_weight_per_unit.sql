-- Rename inventory_items.weight_total to weight_per_unit
-- Note: This migration only renames the column (no data transformation).
-- If your existing data stored TOTAL weight, you may want to convert:
--   update inventory_items
--   set weight_per_unit = weight_per_unit / nullif(initial_qty, 0)
--   where weight_per_unit is not null;

ALTER TABLE "inventory_items" RENAME COLUMN "weight_total" TO "weight_per_unit";

COMMENT ON COLUMN "inventory_items"."weight_per_unit" IS '单件重量(kg)';







