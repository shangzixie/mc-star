# Master Bill of Lading (MBL) Implementation

## Overview

This document describes the implementation of the Master Bill of Lading (MBL) feature for warehouse receipts in the freight management system.

## Summary

A new MBL table has been created with a **one-to-one relationship** with the `warehouse_receipts` table. The MBL form is now accessible in the freight inbound detail page at `/zh/freight/inbound/[id]` under a new "提单信息" (Bill of Lading) tab, next to the "联系资料" (Contact Information) tab.

## Features Implemented

### 1. Database Schema

**Table:** `master_bills_of_lading`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| receipt_id | UUID | Foreign key to warehouse_receipts (UNIQUE, one-to-one) |
| port_of_destination | TEXT | 目的港 (Port of Destination) |
| country_of_destination | VARCHAR(100) | 目的国 (Country of Destination) |
| port_of_discharge | TEXT | 卸货港 (Port of Discharge) |
| port_of_loading | TEXT | 起运港 (Port of Loading) |
| place_of_receipt | TEXT | 收货地 (Place of Receipt) |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Constraints:**
- `receipt_id` has a UNIQUE constraint ensuring one-to-one relationship
- Foreign key with CASCADE delete (when receipt is deleted, MBL is automatically deleted)
- Index on `receipt_id` for fast lookups

**Migration File:** `/src/db/migrations/0009_add_master_bills_of_lading.sql`

### 2. Schema & Validation

**Files:**
- `/src/lib/freight/schemas.ts` - Added `createMasterBillOfLadingSchema` and `updateMasterBillOfLadingSchema`
- `/src/lib/freight/api-types.ts` - Added `FreightMasterBillOfLading` type

### 3. API Routes

**Endpoint:** `/api/freight/master-bills-of-lading/[receiptId]`

**Methods:**
- `GET` - Retrieve MBL for a receipt (returns null if not exists)
- `POST` - Create MBL for a receipt
- `PATCH` - Update MBL fields

**File:** `/src/app/api/freight/master-bills-of-lading/[receiptId]/route.ts`

### 4. React Hooks

**File:** `/src/hooks/freight/use-freight-mbl.ts`

**Hooks:**
- `useFreightMBL(receiptId)` - Fetch MBL data
- `useCreateFreightMBL(receiptId)` - Create MBL mutation
- `useUpdateFreightMBL(receiptId)` - Update MBL mutation

### 5. UI Components

**Files:**
- `/src/components/freight/inbound/mbl-form-section.tsx` - New MBL form component
- `/src/components/freight/inbound/receipt-detail-edit-view.tsx` - Updated to include MBL form alongside contact information

**Layout:**
- MBL form is displayed in the "基本" (Basic) tab
- Positioned on the **right side** of "联系资料" (Contact Information)
- Both sections are displayed side-by-side in a 2-column grid layout

**Features:**
- Auto-save functionality with dirty state tracking
- Form validation using React Hook Form + Zod
- Loading states and error handling
- Responsive grid layout for form fields

### 6. Internationalization

**Files:**
- `/messages/zh.json` - Added Chinese translations
- `/messages/en.json` - Added English translations

**Translation Keys:**
- `Dashboard.freight.inbound.detailTabs.mbl`
- `Dashboard.freight.inbound.detailSections.mbl`
- `Dashboard.freight.inbound.mbl.*`

## How to Use

### 1. Apply Database Migration

Run the migration to create the MBL table:

```bash
pnpm db:push
# or
pnpm db:migrate
```

### 2. Access MBL Form

1. Navigate to `/zh/freight/inbound` (or `/en/freight/inbound`)
2. Click on any existing warehouse receipt
3. In the "基本" (Basic) tab, you will see two sections side by side:
   - **Left**: "联系资料" (Contact Information)
   - **Right**: "提单信息 (MBL)" (Master Bill of Lading)
4. Fill in the MBL information on the right:
   - 目的港 (Port of Destination)
   - 目的国 (Country of Destination)
   - 卸货港 (Port of Discharge)
   - 起运港 (Port of Loading)
   - 收货地 (Place of Receipt)
5. Click "保存" (Save) button in the MBL section to save the information

### 3. Edit MBL Information

Once created, the MBL information will be automatically loaded when you visit the same receipt. You can edit any field and save again to update.

## Technical Details

### One-to-One Relationship

The relationship is enforced at the database level through:
- UNIQUE constraint on `receipt_id` column
- Foreign key constraint with CASCADE delete

This ensures:
- Each warehouse receipt can have at most one MBL
- Each MBL belongs to exactly one warehouse receipt
- Deleting a warehouse receipt automatically deletes its MBL

### API Design

The API uses the receipt ID in the URL path (`/api/freight/master-bills-of-lading/[receiptId]`) to:
- Maintain RESTful design principles
- Enforce the one-to-one relationship
- Simplify client-side code (no need to manage separate MBL IDs)

### Form State Management

- Uses React Hook Form for form state
- Zod for validation
- Automatic dirty state tracking
- Unsaved changes warning (through form state)
- Optimistic UI updates through React Query

## Files Changed/Created

### Created:
1. `/src/db/migrations/0009_add_master_bills_of_lading.sql`
2. `/src/app/api/freight/master-bills-of-lading/[receiptId]/route.ts`
3. `/src/hooks/freight/use-freight-mbl.ts`
4. `/src/components/freight/inbound/mbl-form-section.tsx`
5. `/docs/MBL_IMPLEMENTATION.md` (this file)

### Modified:
1. `/src/db/schema.ts` - Added `masterBillsOfLading` table
2. `/src/lib/freight/schemas.ts` - Added MBL schemas
3. `/src/lib/freight/api-types.ts` - Added MBL types
4. `/src/components/freight/inbound/receipt-detail-edit-view.tsx` - Added MBL tab
5. `/messages/zh.json` - Added Chinese translations
6. `/messages/en.json` - Added English translations

## Future Enhancements

Possible future improvements:
1. Add autocomplete for port names
2. Integrate with port/country databases
3. Add validation for port codes (e.g., UN/LOCODE)
4. Add MBL document upload capability
5. Generate MBL PDF documents
6. Add MBL history/audit trail

## Testing

To test the implementation:

1. **Create a warehouse receipt** if you don't have one
2. **Navigate to the receipt detail page**
3. **Click on the "提单信息" tab**
4. **Fill in some MBL information** and save
5. **Reload the page** and verify the data persists
6. **Try editing** the MBL information
7. **Delete the warehouse receipt** and verify the MBL is also deleted

## Notes

- All fields in the MBL form are optional
- The form uses auto-save (no need to manually save after each field)
- The migration file needs to be applied before the feature can be used
- The implementation follows the existing patterns in the freight management system

