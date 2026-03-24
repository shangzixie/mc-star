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

---

### 8) 入库/出库：涉及哪些表？流程怎么走？（中文补充）

> 本节以实际 schema 为准：`src/db/schema.ts` / `scripts/build_relations.sql`，并可对照 `docs/RELATIONS.md` 了解更完整的中文表结构说明。

#### 8.1 入库（Inbound）

**入库“核心动作”涉及 3 张表**（必写）：

- `warehouse_receipts`：入库单（单头）
- `inventory_items`：入库明细/库存批次台账（形成库存）
- `inventory_movements`：库存流水（审计/回溯，入库为正数）

**入库“依赖主数据”还会关联 2 张表**（外键引用，不一定在入库时新增）：

- `warehouses`：仓库档案（`warehouse_receipts.warehouse_id`）
- `parties`：货主/客户（`warehouse_receipts.customer_id`）

**推荐入库流程**（对应接口见上方 “Inbound / Inventory query”）：

- **Step A：创建入库单（单头）**
  - 写 `warehouse_receipts`（`receipt_no/warehouse_id/customer_id/inbound_time/status` 等）
- **Step B：新增入库明细（形成库存批次）**
  - 写 `inventory_items`
  - 关键字段：`initial_qty = 入库数量`，`current_qty = initial_qty`（入库完成后余额=入库数）
- **Step C：写入库存流水（推荐强制做）**
  - 写 `inventory_movements`
  - 推荐：`ref_type='RECEIPT'`，`ref_id=warehouse_receipts.id`，`qty_delta=+initial_qty`

#### 8.2 出库（Outbound：分配 → 拣货 → 装柜 → 出库）

**出库“核心动作”涉及 4 张表**（必写/必更新）：

- `inventory_allocations`：出库核心明细（4-stage 的数量与状态都在这张表）
- `inventory_items`：库存余额（只在最终 SHIP 扣减 `current_qty`）
- `inventory_movements`：库存流水（最终 SHIP 记一条负数流水）
- `shipments`：业务单（承载“这票货”的上下文）

**出库“常见配套”还会用到 2–4 张表**（按业务需要）：

- `containers`：柜信息（装柜阶段要求 allocation 绑定 `container_id`；也可先不建，装柜时再补）
- `cargo_items`：柜内货描（单证/清单口径；不作为库存扣减依据）
- `attachments`：单证/附件（与库存无关）
- 主数据：`parties`、`transport_nodes`（业务单的主体/港口信息）

**推荐出库操作流程（与本文 4-stage 规则一致）**：

- **Step 0：创建业务单/柜（可选先后）**
  - 写 `shipments`
  - 需要柜时写 `containers`
- **Step 1：ALLOCATE（分配/预占）— 不扣库存余额**
  - 写 `inventory_allocations`（`allocated_qty`，`status='ALLOCATED'`）
  - 关键：分配可用量= `inventory_items.current_qty - sum(allocated_qty)`（仅统计 `ALLOCATED|PICKED|LOADED`）
- **Step 2：PICK（拣货）**
  - 更新 `inventory_allocations.picked_qty`（单调递增，且 `picked_qty <= allocated_qty`）
  - 更新 `status='PICKED'`
- **Step 3：LOAD（装柜）**
  - 更新 `inventory_allocations.loaded_qty`（单调递增，且 `loaded_qty <= picked_qty`）
  - 需要绑定柜：设置/更新 `container_id`，并更新 `status='LOADED'`
- **Step 4：SHIP（出库确认）— 最终扣库存**
  - 更新 `inventory_allocations.shipped_qty`（单调递增，且 `shipped_qty <= loaded_qty`）
  - 更新 `status='SHIPPED'`
  - 写 `inventory_movements`：`ref_type='SHIP'`，`ref_id=inventory_allocations.id`（推荐），`qty_delta = -shipped_qty`
  - 更新 `inventory_items.current_qty = current_qty - shipped_qty`

**补充：一条分配拆到多个柜（one allocation → multiple containers）**

- 因为 `inventory_allocations` 只有一个 `container_id`，所以用 `POST /api/freight/allocations/:id/split`
- 约束：仅允许在 `status='ALLOCATED'` 且 `picked_qty=loaded_qty=shipped_qty=0` 时拆分


