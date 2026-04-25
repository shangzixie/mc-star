ALTER TABLE warehouse_receipt_merges
ADD COLUMN IF NOT EXISTS relation_type VARCHAR(20) NOT NULL DEFAULT 'MERGE';

CREATE INDEX IF NOT EXISTS idx_receipt_merges_relation_type
ON warehouse_receipt_merges(relation_type);

