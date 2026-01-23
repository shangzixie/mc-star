CREATE TABLE warehouse_receipt_merges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_receipt_id UUID NOT NULL REFERENCES warehouse_receipts(id) ON DELETE CASCADE,
    child_receipt_id UUID NOT NULL REFERENCES warehouse_receipts(id) ON DELETE CASCADE,
    created_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_receipt_merges_parent ON warehouse_receipt_merges(parent_receipt_id);
CREATE INDEX idx_receipt_merges_child ON warehouse_receipt_merges(child_receipt_id);

CREATE TABLE warehouse_receipt_status_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES warehouse_receipts(id) ON DELETE CASCADE,
    from_status VARCHAR(20) NOT NULL,
    to_status VARCHAR(20) NOT NULL,
    changed_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
    reason TEXT,
    batch_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_receipt_status_logs_receipt ON warehouse_receipt_status_logs(receipt_id);
CREATE INDEX idx_receipt_status_logs_batch ON warehouse_receipt_status_logs(batch_id);
