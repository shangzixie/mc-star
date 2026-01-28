-- Migration: Add audit_status column to warehouse_receipts table
-- Date: 2026-01-28
-- Description: Adds audit_status column with default value 'NOT_AUDITED'

-- Add the audit_status column
ALTER TABLE warehouse_receipts
ADD COLUMN IF NOT EXISTS audit_status VARCHAR(20) NOT NULL DEFAULT 'NOT_AUDITED';

-- Add a comment to the column
COMMENT ON COLUMN warehouse_receipts.audit_status IS 'Audit status: NOT_AUDITED or AUDITED';

-- Create an index on audit_status for better query performance
CREATE INDEX IF NOT EXISTS idx_warehouse_receipts_audit_status
ON warehouse_receipts(audit_status);
