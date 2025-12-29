## Freight Backend (MVP) — API + 4-Stage Outbound Workflow

This document describes the **backend implementation** for the freight forwarding / warehouse outbound-loading flow based on:

- `scripts/build_relations.sql`
- `docs/RELATIONS.md`

Implementation highlights:

- **Next.js Route Handlers**: `src/app/api/freight/**`
- **Drizzle schema**: `src/db/schema.ts`
- **Core domain guards (unit-tested)**: `src/lib/freight/allocation-state.ts`
- **Strict anti-overallocation**: implemented in `src/lib/freight/services/allocations.ts` via transaction + row locks.
- **Cloudflare R2 storage**: reuse existing upload endpoint `src/app/api/storage/upload/route.ts` (S3-compatible via `s3mini`).

---

### 1) Concepts & Statuses

#### Inventory

- `inventory_items.initial_qty`: inbound quantity (immutable baseline)
- `inventory_items.current_qty`: **remaining balance** (deducted only on final SHIP)
- `inventory_movements`: immutable audit log (`qty_delta` + `ref_type/ref_id`)

#### Allocation 4 stages (required)

Allocations are represented by `inventory_allocations` rows. A single inbound batch (`inventory_item`) can be allocated to multiple containers by:

- creating multiple allocation rows, OR
- creating one allocation row first, then using **split** (recommended) before pick/load starts.

Statuses:

- `ALLOCATED` → `PICKED` → `LOADED` → `SHIPPED`
- `CANCELLED` (only before SHIPPED)

Rules (enforced in code):

- **Strict anti-overallocation**:
  - available to allocate = `inventory_items.current_qty - sum(allocated_qty)` of allocations in status `ALLOCATED|PICKED|LOADED`
  - allocation is rejected if `requestedQty > available`
- **Monotonic quantities**:
  - `picked_qty` / `loaded_qty` / `shipped_qty` can **only increase**
- **Bounded by previous stage**:
  - `picked_qty <= allocated_qty`
  - `loaded_qty <= picked_qty`
  - `shipped_qty <= loaded_qty`
- **Container required before load**:
  - `container_id` must exist at LOADED stage (can be assigned at load time)
- **Ship is final**:
  - When SHIP succeeds, we append a movement `ref_type='SHIP'` and deduct `inventory_items.current_qty`.

#### “One allocation → multiple containers”

Because the DB model has a single `container_id` on `inventory_allocations`, we support “one planned allocation split into multiple containers” by:

- `POST /api/freight/allocations/:id/split`
- constraint: only allowed when status is `ALLOCATED` and `picked_qty=loaded_qty=shipped_qty=0`

This keeps the schema unchanged but still supports multi-container outbound.

---

### 2) Authentication

All freight endpoints require an authenticated internal user:

- Guard: `src/lib/api/auth.ts` → `requireUser(request)`

> Note: This project uses Better Auth. In production you must set `BETTER_AUTH_SECRET`.

---

### 3) API Response Format

Successful responses:

```json
{ "data": ... }
```

Errors:

```json
{
  "error": {
    "code": "SOME_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

Common error codes:

- `UNAUTHORIZED`
- `VALIDATION_ERROR`
- `INVALID_STATE`
- `INVALID_QUANTITY`
- `INSUFFICIENT_INVENTORY`

---

### 4) Endpoints (MVP)

Base path: `/api/freight`

#### Master data

- `GET /parties?q=...`
- `POST /parties`
- `GET /parties/:id`
- `PATCH /parties/:id`

- `GET /locations?q=...` (backed by DB table `transport_nodes`)
- `POST /locations`
- `GET /locations/:id`
- `PATCH /locations/:id`

- `GET /warehouses?q=...`
- `POST /warehouses`
- `GET /warehouses/:id`
- `PATCH /warehouses/:id`

#### Inbound

- `GET /warehouse-receipts?warehouseId=...&customerId=...`
- `POST /warehouse-receipts`
- `GET /warehouse-receipts/:id`
- `PATCH /warehouse-receipts/:id`

Add inbound item (also writes movement `RECEIPT` and sets `current_qty = initial_qty`):

- `POST /warehouse-receipts/:id/items`

#### Inventory query

- `GET /inventory-items?receiptId=...&q=...`
- `GET /inventory-items/:id/movements`

#### Shipment & containers

- `GET /shipments?q=...&status=...`
- `POST /shipments`
- `GET /shipments/:id`
- `PATCH /shipments/:id`

- `GET /shipments/:id/containers`
- `POST /shipments/:id/containers`
- `GET /containers/:id`
- `PATCH /containers/:id`

#### Allocations (4-stage outbound workflow)

List/filter:

- `GET /allocations?shipmentId=...&containerId=...&inventoryItemId=...`

Create allocation (strict anti-overallocation):

- `POST /allocations`

Actions:

- `POST /allocations/:id/pick` body: `{ "pickedQty": 0..allocatedQty }`
- `POST /allocations/:id/load` body: `{ "loadedQty": 0..pickedQty, "containerId"?: "uuid" }`
- `POST /allocations/:id/ship` body: `{ "shippedQty": 1..loadedQty }`
- `POST /allocations/:id/cancel`
- `POST /allocations/:id/split` body: `{ "splitQty": 1..(allocatedQty-1), "newContainerId"?: "uuid" }`

#### Attachments (R2)

Upload files (existing endpoint, S3-compatible, works with Cloudflare R2):

- `POST /api/storage/upload` (multipart form-data, field `file`, optional `folder`)

Persist attachment metadata:

- `GET /freight/attachments?shipmentId=...`
- `POST /freight/attachments`
- `DELETE /freight/attachments/:id`

> The `attachments.uploaded_by` column is UUID in `build_relations.sql`. Better Auth user ids are text, so we currently store `uploaded_by = NULL` in the MVP.

---

### 5) Environment Variables

DB:

- `DATABASE_URL`

Auth (required for production):

- `BETTER_AUTH_SECRET`

Cloudflare R2 (storage provider is S3-compatible):

- `STORAGE_REGION`
- `STORAGE_ENDPOINT` (R2 S3 endpoint)
- `STORAGE_ACCESS_KEY_ID`
- `STORAGE_SECRET_ACCESS_KEY`
- `STORAGE_BUCKET_NAME`
- `STORAGE_PUBLIC_URL` (optional, custom public domain)

---

### 6) Unit Tests

Core allocation guards are unit-tested (pure functions):

- `src/lib/freight/allocation-state.test.ts`

Run:

- `pnpm test`

---

### 7) Implementation Map (where to extend)

- **Guard logic**: `src/lib/freight/allocation-state.ts`
  - add new constraints here and cover with unit tests
- **Transactional writes**: `src/lib/freight/services/allocations.ts`
  - if you add more mutation steps (e.g. unship/rollback), keep them inside a transaction and append movements for audit.
- **API routes**: `src/app/api/freight/**`
  - keep route handlers thin; put business logic in services.


