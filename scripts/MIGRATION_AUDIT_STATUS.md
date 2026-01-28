# Database Migration: Add Audit Status Column

## Overview
This migration adds an `audit_status` column to the `warehouse_receipts` table to track whether receipts have been audited.

## Changes Made

### Database Schema
- Added `audit_status` column to `warehouse_receipts` table
  - Type: `VARCHAR(20)`
  - Default value: `'NOT_AUDITED'`
  - Not null constraint
  - Indexed for performance

### Enum Values
- `NOT_AUDITED` (未审核) - Default status
- `AUDITED` (已审核) - Receipt has been audited

### Application Code
1. **Enums** (`src/db/enums/index.ts`):
   - Added `AUDIT_STATUSES` constant
   - Added `AuditStatus` type

2. **Database Schema** (`src/db/schema.ts`):
   - Added `auditStatus` field to `warehouseReceipts` table definition

3. **API Types** (`src/lib/freight/api-types.ts`):
   - Added `auditStatus` field to `freightWarehouseReceiptSchema`

4. **Schemas** (`src/lib/freight/schemas.ts`):
   - Added `auditStatus` field to `createWarehouseReceiptSchema`

5. **UI Components**:
   - Added audit status column to receipt list view
   - Column appears between "Customer" and "Status" columns
   - Visual styling: Green badge for "已审核", Orange badge for "未审核"

6. **Translations** (`messages/zh.json`):
   - Added column label: `"auditStatus": "审核状态"`
   - Added enum options:
     - `"NOT_AUDITED": "未审核"`
     - `"AUDITED": "已审核"`

## How to Run the Migration

### Option 1: Using psql
```bash
psql -U your_username -d your_database -f scripts/add_audit_status_column.sql
```

### Option 2: Using your database client
Execute the SQL commands in `scripts/add_audit_status_column.sql` directly in your database client.

### Option 3: Using Drizzle (if configured)
If you're using Drizzle migrations:
```bash
npm run db:push
# or
npm run db:migrate
```

## Verification

After running the migration, verify the changes:

```sql
-- Check if the column exists
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'warehouse_receipts' AND column_name = 'audit_status';

-- Check if the index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'warehouse_receipts' AND indexname = 'idx_warehouse_receipts_audit_status';

-- Verify default value is applied to existing records
SELECT audit_status, COUNT(*) as count
FROM warehouse_receipts
GROUP BY audit_status;
```

## Rollback (if needed)

If you need to rollback this migration:

```sql
-- Remove the index
DROP INDEX IF EXISTS idx_warehouse_receipts_audit_status;

-- Remove the column
ALTER TABLE warehouse_receipts DROP COLUMN IF EXISTS audit_status;
```

## Notes
- All existing records will automatically have `audit_status` set to `'NOT_AUDITED'`
- The column is sortable and filterable in the UI
- The audit status is displayed as a colored badge in the receipt list
