# Employee Assignments Implementation

## Overview

This document describes the frontend implementation of the Employee Assignments feature for the Freight Inbound Receipt detail page. The backend database fields are not yet implemented - this is a frontend-only implementation that will be ready to connect once the backend is developed.

## Architecture

### 1. API Layer
**File:** `src/app/api/freight/employees/route.ts`

- **Endpoint:** `GET /api/freight/employees`
- **Query Parameters:** 
  - `q` (optional): Search term for fuzzy search on employee full name
- **Response:** Array of employee objects
- **Features:**
  - Fuzzy search using `ilike` on `fullName` field
  - Results ordered alphabetically by full name
  - Requires user authentication

### 2. Data Layer
**File:** `src/hooks/freight/use-freight-employees.ts`

- **Hook:** `useFreightEmployees({ q?: string })`
- **Technology:** React Query with 5-minute stale time
- **Features:**
  - Automatic caching and refetching
  - Debounced search support (300ms)
  - Type-safe with TypeScript interface

**Employee Interface:**
```typescript
interface FreightEmployee {
  id: string;
  userId: string | null;
  fullName: string;
  branch: string;
  department: string;
}
```

### 3. Component Layer

#### EmployeeCombobox Component
**File:** `src/components/freight/shared/employee-combobox.tsx`

Reusable combobox component for selecting employees with:
- Fuzzy search with 300ms debouncing
- Command palette UI (shadcn/ui)
- Shows employee name with department/branch as secondary info
- Follows the same pattern as `CustomerCombobox` for consistency

**Props:**
- `value?: string` - Selected employee ID
- `onValueChange: (value: string | undefined) => void` - Change handler
- `disabled?: boolean` - Disable state
- `className?: string` - Custom styling
- `placeholder?: string` - Placeholder text

#### EmployeeAssignmentsSection Component
**File:** `src/components/freight/inbound/employee-assignments-section.tsx`

Section component containing 7 employee role dropdowns:

| Role (English) | Role (Chinese) | Field Name |
|----------------|----------------|------------|
| Sales Representative | 业务员 | `salesEmployeeId` |
| Customer Service | 客服 | `customerServiceEmployeeId` |
| Overseas Customer Service | 海外客服 | `overseasCsEmployeeId` |
| Operations | 操作 | `operationsEmployeeId` |
| Documentation | 文件 | `documentationEmployeeId` |
| Finance | 财务 | `financeEmployeeId` |
| Booking | 订舱工作 | `bookingEmployeeId` |

**Features:**
- All fields are optional
- Uses `FreightSection` wrapper for consistent styling
- Each role has its own `EmployeeCombobox` instance
- Triggers form dirty state on change

### 4. Integration
**File:** `src/components/freight/inbound/receipt-detail-edit-view.tsx`

**Changes Made:**

1. **Schema Extension:**
   - Added 7 employee ID fields to `receiptFormSchema` (all optional)

2. **Form State:**
   - Added default values for all employee fields (empty strings)
   - Integrated with React Hook Form's dirty tracking

3. **Layout:**
   - Changed from 2-column to 3-column grid: `lg:grid-cols-3`
   - **Left:** Employee Assignments Section (new)
   - **Middle:** Contact Information (existing)
   - **Right:** Master Bill of Lading (existing)

4. **Save Handler:**
   - Extended `handleSave` to include employee fields in payload
   - Added comment noting backend fields not yet implemented
   - Employee data will be sent to API but won't persist until backend is ready

5. **Unsaved Changes:**
   - Employee field changes trigger the "unsaved changes" warning
   - Integrated with existing `beforeunload` handler

### 5. Internationalization
**Files:** `messages/en.json`, `messages/zh.json`

Added translations under `Dashboard.freight.inbound.employees`:

```json
{
  "employees": {
    "title": "Employee Assignments" / "雇员分配",
    "selectEmployee": "Select employee" / "选择雇员",
    "searchEmployee": "Search employee name..." / "搜索雇员姓名...",
    "noEmployeeFound": "No employee found" / "未找到雇员",
    "roles": {
      "sales": "Sales Representative" / "业务员",
      "customerService": "Customer Service" / "客服",
      "overseasCs": "Overseas Customer Service" / "海外客服",
      "operations": "Operations" / "操作",
      "documentation": "Documentation" / "文件",
      "finance": "Finance" / "财务",
      "booking": "Booking" / "订舱工作"
    }
  }
}
```

## Database Schema (To Be Implemented)

The following fields need to be added to the `warehouse_receipts` table:

```sql
ALTER TABLE warehouse_receipts
ADD COLUMN sales_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
ADD COLUMN customer_service_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
ADD COLUMN overseas_cs_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
ADD COLUMN operations_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
ADD COLUMN documentation_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
ADD COLUMN finance_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
ADD COLUMN booking_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX idx_wr_sales_employee ON warehouse_receipts(sales_employee_id);
CREATE INDEX idx_wr_cs_employee ON warehouse_receipts(customer_service_employee_id);
CREATE INDEX idx_wr_overseas_cs_employee ON warehouse_receipts(overseas_cs_employee_id);
CREATE INDEX idx_wr_operations_employee ON warehouse_receipts(operations_employee_id);
CREATE INDEX idx_wr_documentation_employee ON warehouse_receipts(documentation_employee_id);
CREATE INDEX idx_wr_finance_employee ON warehouse_receipts(finance_employee_id);
CREATE INDEX idx_wr_booking_employee ON warehouse_receipts(booking_employee_id);
```

## Backend API Updates Needed

### 1. Update Drizzle Schema
**File:** `src/db/schema.ts`

Add employee reference fields to `warehouseReceipts` table definition:

```typescript
export const warehouseReceipts = pgTable(
  'warehouse_receipts',
  {
    // ... existing fields ...
    
    // Employee assignments
    salesEmployeeId: uuid('sales_employee_id').references(() => employees.id, {
      onDelete: 'set null',
    }),
    customerServiceEmployeeId: uuid('customer_service_employee_id').references(
      () => employees.id,
      { onDelete: 'set null' }
    ),
    overseasCsEmployeeId: uuid('overseas_cs_employee_id').references(
      () => employees.id,
      { onDelete: 'set null' }
    ),
    operationsEmployeeId: uuid('operations_employee_id').references(
      () => employees.id,
      { onDelete: 'set null' }
    ),
    documentationEmployeeId: uuid('documentation_employee_id').references(
      () => employees.id,
      { onDelete: 'set null' }
    ),
    financeEmployeeId: uuid('finance_employee_id').references(() => employees.id, {
      onDelete: 'set null',
    }),
    bookingEmployeeId: uuid('booking_employee_id').references(() => employees.id, {
      onDelete: 'set null',
    }),
  },
  (table) => ({
    // ... existing indexes ...
    idxWrSalesEmployee: index('idx_wr_sales_employee').on(table.salesEmployeeId),
    idxWrCsEmployee: index('idx_wr_cs_employee').on(table.customerServiceEmployeeId),
    idxWrOverseasCsEmployee: index('idx_wr_overseas_cs_employee').on(
      table.overseasCsEmployeeId
    ),
    idxWrOperationsEmployee: index('idx_wr_operations_employee').on(
      table.operationsEmployeeId
    ),
    idxWrDocumentationEmployee: index('idx_wr_documentation_employee').on(
      table.documentationEmployeeId
    ),
    idxWrFinanceEmployee: index('idx_wr_finance_employee').on(table.financeEmployeeId),
    idxWrBookingEmployee: index('idx_wr_booking_employee').on(table.bookingEmployeeId),
  })
);
```

### 2. Generate Migration
```bash
pnpm db:generate
```

### 3. Update API Routes

**File:** `src/app/api/freight/warehouse-receipts/[receiptId]/route.ts`

Update the PATCH handler to accept and persist employee fields:

```typescript
// In the PATCH handler, add employee fields to allowed updates
const {
  // ... existing fields ...
  salesEmployeeId,
  customerServiceEmployeeId,
  overseasCsEmployeeId,
  operationsEmployeeId,
  documentationEmployeeId,
  financeEmployeeId,
  bookingEmployeeId,
} = await request.json();

// Add to update object
if (salesEmployeeId !== undefined) {
  updates.salesEmployeeId = salesEmployeeId || null;
}
// ... repeat for other employee fields
```

**File:** `src/app/api/freight/warehouse-receipts/[receiptId]/route.ts` (GET handler)

Ensure employee fields are included in the response when fetching receipt details.

### 4. Update TypeScript Types
**File:** `src/lib/freight/api-types.ts`

Add employee fields to the warehouse receipt type:

```typescript
export interface FreightWarehouseReceipt {
  // ... existing fields ...
  salesEmployeeId?: string | null;
  customerServiceEmployeeId?: string | null;
  overseasCsEmployeeId?: string | null;
  operationsEmployeeId?: string | null;
  documentationEmployeeId?: string | null;
  financeEmployeeId?: string | null;
  bookingEmployeeId?: string | null;
}
```

### 5. Update Form Default Values
**File:** `src/components/freight/inbound/receipt-detail-edit-view.tsx`

Once backend is ready, update the form default values to use actual data:

```typescript
defaultValues: {
  // ... existing fields ...
  salesEmployeeId: receipt.salesEmployeeId ?? '',
  customerServiceEmployeeId: receipt.customerServiceEmployeeId ?? '',
  overseasCsEmployeeId: receipt.overseasCsEmployeeId ?? '',
  operationsEmployeeId: receipt.operationsEmployeeId ?? '',
  documentationEmployeeId: receipt.documentationEmployeeId ?? '',
  financeEmployeeId: receipt.financeEmployeeId ?? '',
  bookingEmployeeId: receipt.bookingEmployeeId ?? '',
},
```

## Design Decisions

### Maintainability
1. **Reusable Components:** `EmployeeCombobox` can be reused anywhere employees need to be selected
2. **Consistent Patterns:** Follows existing patterns from `CustomerCombobox` and `FreightSection`
3. **Type Safety:** Full TypeScript coverage with Zod validation
4. **Proper Separation:** API, hooks, and components are properly separated

### Scalability
1. **React Query Caching:** Reduces API calls and improves performance
2. **Debounced Search:** Prevents excessive API requests during typing
3. **Indexed Database Fields:** When implemented, will ensure fast queries
4. **Lazy Loading Ready:** Can easily add pagination if employee list grows large

### User Experience
1. **Fuzzy Search:** Users can quickly find employees by typing partial names
2. **Visual Feedback:** Shows department/branch info to help distinguish employees
3. **Unsaved Changes Warning:** Prevents accidental data loss
4. **Responsive Layout:** 3-column grid collapses gracefully on smaller screens
5. **i18n Support:** Full bilingual support (English/Chinese)

## Testing Checklist

Once backend is implemented, test the following:

- [ ] Employee dropdown loads and displays all employees
- [ ] Fuzzy search works correctly (partial name matching)
- [ ] Selecting an employee updates the form state
- [ ] Clearing an employee selection works
- [ ] Form shows "unsaved changes" when employee is selected/changed
- [ ] Save button persists employee assignments to database
- [ ] Reloading the page shows previously saved employee assignments
- [ ] All 7 employee roles work independently
- [ ] Multiple employees can be assigned to different roles
- [ ] Same employee can be assigned to multiple roles
- [ ] Deleting an employee from the database sets the field to NULL (not breaks the form)
- [ ] i18n translations display correctly in both languages
- [ ] Layout is responsive on mobile/tablet/desktop
- [ ] Performance is acceptable with large employee lists

## Future Enhancements

1. **Employee Filtering:** Filter employees by department for specific roles
2. **Employee Details:** Show more employee info in tooltip (like CustomerCombobox)
3. **Quick Add:** Allow creating new employees inline
4. **History Tracking:** Track changes to employee assignments over time
5. **Bulk Assignment:** Assign same employees to multiple receipts at once
6. **Role Permissions:** Restrict which users can assign employees to roles
7. **Notifications:** Notify employees when assigned to a receipt
8. **Workload View:** Dashboard showing employee workload distribution

## Notes

- The frontend is fully functional and ready to use
- Backend database schema and API updates are required for persistence
- All employee data is currently stored in form state only
- No breaking changes to existing functionality
- Can be deployed to production (will just show empty dropdowns until backend is ready)

