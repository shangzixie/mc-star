ALTER TABLE warehouse_receipt_merges
ADD COLUMN IF NOT EXISTS relation_type VARCHAR(20) NOT NULL DEFAULT 'MERGE';

UPDATE warehouse_receipt_merges wrm
SET relation_type = 'REPACK'
WHERE EXISTS (
  SELECT 1
  FROM inventory_items ii
  INNER JOIN inventory_movements im ON im.inventory_item_id = ii.id
  WHERE ii.receipt_id = wrm.parent_receipt_id
    AND im.ref_type = 'REPACK_IN'
    AND im.ref_id = wrm.parent_receipt_id
);

CREATE INDEX IF NOT EXISTS idx_receipt_merges_relation_type
ON warehouse_receipt_merges(relation_type);
