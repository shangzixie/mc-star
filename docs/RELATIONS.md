## 货代仓库出货装柜：表结构说明与业务流程（`build_relations.sql`）

这份文档仅基于 `scripts/build_relations.sql`，用于解释每个表的目的，以及**入库**与**出货装柜**的推荐流程（每一步会用到哪些表）。

### 概览：核心业务对象怎么串起来

- **主数据**：`parties`（合作方）、`transport_nodes`（运输节点：POL/POD）、`warehouses`（仓库）
- **仓库入库与库存**：`warehouse_receipts`（入库单）→ `inventory_items`（入库批次/库存台账）
- **业务单与装柜**：`shipments`（业务主单）→ `containers`（柜）→ `cargo_items`（柜内货物描述/单证口径）
- **仓库出货装柜关键补充**：`inventory_allocations`（库存分配/拣货/装柜/出库明细）与 `inventory_movements`（库存流水）
- **单证/附件**：`attachments`（按 shipment 归档）

### 表说明（逐表）

#### `parties`：合作伙伴/主体档案

- **目的**：统一管理客户、发货人、收货人、船司/航司、代理等主体信息。
- **关键字段**：
  - `roles VARCHAR(20)[]`：主体可以同时拥有多个角色（例如既是客户又是发货人）。
  - `contact_info JSONB`：多联系人/电话/邮箱等扩展信息。
- **常见关联**：`shipments.client_id/shipper_id/consignee_id/agent_id/carrier_id`，`warehouse_receipts.customer_id`。

#### `transport_nodes`：运输节点（POL/POD：港口/机场/铁路站/口岸等）

- **目的**：统一管理起运港/目的港等运输节点（UN/LOCODE）。
- **关键字段**：`un_locode`、`country_code`、`type`（SEA/AIR/RAIL/ROAD）。
- **常见关联**：`shipments.pol_id`、`shipments.pod_id`。

#### `warehouses`：仓库档案

- **目的**：仓库的基本信息（地址、联系人、扩展 metadata）。
- **常见关联**：`warehouse_receipts.warehouse_id`。

#### `warehouse_receipts`：入库单（收货单）

- **目的**：一次入库事件的“单头”，包含仓库、货主、入库时间、状态、备注等。
- **关键字段**：
  - `receipt_no`：入库单号（唯一）。
  - `status`：当前仅保留简单状态（RECEIVED/SHIPPED/PARTIAL）。
- **常见关联**：`inventory_items.receipt_id`（入库单下的明细/批次）。

#### `inventory_items`：入库商品明细 / 库存批次台账

- **目的**：记录入库后形成的“库存批次”（或台账行），用于后续分配/出库。
- **关键字段**：
  - `initial_qty`：入库数量（固定不变，作为基数）。
  - `current_qty`：当前可用库存余额（会随出库扣减/调整而变化）。
  - `bin_location`：库位（简化版）。
- **常见关联**：`inventory_allocations.inventory_item_id`、`inventory_movements.inventory_item_id`。

#### `shipments`：业务主单（Job）

- **目的**：一票业务的“主单”，串联客户/主体、航线（POL/POD）、业务状态、提单号等。
- **关键字段**：`job_no`（唯一业务号）、`mbl_no/hbl_no`、`status`、`etd/eta`。
- **常见关联**：`containers.shipment_id`、`cargo_items.shipment_id`、`attachments.shipment_id`、`inventory_allocations.shipment_id`。

#### `containers`：集装箱/柜

- **目的**：一票 shipment 下可能有多个柜，记录箱号、箱型、封条等。
- **关键字段**：`container_no`（唯一）、`container_type`、`seal_no`。
- **常见关联**：`cargo_items.container_id`、`inventory_allocations.container_id`。

#### `cargo_items`：柜内货物明细（单证/清单口径）

- **目的**：描述柜内货物的“单证口径”信息（品名/HS/唛头/毛体件等），用于清单、申报、提单等文档。
- **注意**：实际“从仓库哪条库存扣了多少”以 `inventory_allocations` + `inventory_movements` 为准；`cargo_items.quantity` 可用于展示/文档汇总，不建议单独作为库存扣减依据。

#### `inventory_allocations`：库存分配/拣货/装柜/出库明细（出库核心）

- **目的**：把“仓库库存批次”与“业务 shipment/柜”建立数量级关联，支持：
  - 一个 `inventory_item` **拆分**到多个 shipment / 多个柜；
  - 同一批次 **部分出库**（先分配、再拣货、再装柜、最终出库）。
- **关键字段**：
  - `allocated_qty`：预占/分配数量（不建议立即扣 `inventory_items.current_qty`，用于“计划/锁定”）
  - `picked_qty`：已拣数量
  - `loaded_qty`：已装柜数量
  - `shipped_qty`：已出库数量（建议以此作为最终扣减库存的数量）
  - `status`：阶段状态（ALLOCATED/PICKED/LOADED/SHIPPED/CANCELLED）
- **常见关联**：指向 `inventory_items`、`shipments`、可选指向 `containers`。

#### `inventory_movements`：库存流水（审计/回溯/冲销）

- **目的**：记录所有会影响库存的“数量变动”，用于审计、对账、追溯与冲销。
- **关键字段**：
  - `qty_delta`：正数入库、负数出库、盘点调整等。
  - `ref_type/ref_id`：引用来源（RECEIPT/SHIP/ADJUST 等）及其 ID（例如 `warehouse_receipts.id` 或 `inventory_allocations.id`）。

#### `attachments`：单证/附件

- **目的**：把业务单的相关文件（B/L、Invoice、Packing List、照片等）归档到 shipment。
- **关键字段**：`file_type`、`file_url`、`uploaded_by`（预留）。

### 流程 1：入库（Inbound）

#### 前置条件（主数据）

- **创建/维护**：`parties`（货主/客户）、`warehouses`（仓库）

#### 步骤

- **步骤 A：创建入库单（单头）**
  - **写入**：`warehouse_receipts`
  - **字段要点**：`receipt_no`、`warehouse_id`、`customer_id`、`inbound_time`、`status='RECEIVED'`

- **步骤 B：写入入库明细（形成库存批次）**
  - **写入**：`inventory_items`
  - **字段要点**：
    - `initial_qty = 入库数量`
    - `current_qty = initial_qty`（入库完成后余额=入库数）
    - 记录 `unit/bin_location/weight_total/尺寸` 等

- **步骤 C：写入库存流水（推荐）**
  - **写入**：`inventory_movements`
  - **推荐写法**：每条 `inventory_items` 生成一条 `ref_type='RECEIPT'` 的流水
    - `ref_id = warehouse_receipts.id`（或扩展为 receipt_line 的 id；当前模型用 receipt.id 也可）
    - `qty_delta = +initial_qty`

### 流程 2：仓库出货装柜（Outbound → Load Container → Ship）

#### 前置条件（业务单与柜）

- **创建/维护**：`parties`（客户、shipper/consignee、carrier/agent）、`transport_nodes`（POL/POD）
- **步骤 0：创建业务主单**
  - **写入**：`shipments`（得到 `shipment_id`）
- **步骤 1：创建柜（可选：先有柜再装；或装货阶段再补柜信息）**
  - **写入**：`containers`（得到 `container_id`）

#### 出库推荐分阶段（分配 → 拣货 → 装柜 → 出库）

- **步骤 2：分配/预占库存（不扣减库存余额）**
  - **读**：`inventory_items`（筛可用库存：`current_qty > 0`，并按库位/批次策略选择）
  - **写**：`inventory_allocations`
    - `allocated_qty = 本次计划出的数量`
    - `picked_qty/loaded_qty/shipped_qty = 0`
    - `status='ALLOCATED'`
    - 关联 `shipment_id`，可选关联 `container_id`
  - **说明**：当前模型没有“reserved_qty”字段；因此“预占”只是通过 `inventory_allocations` 体现，真正扣减在最终出库。

- **步骤 3：拣货（Picked）**
  - **写**：更新 `inventory_allocations.picked_qty` 与 `status='PICKED'`
  - **不建议**在此阶段扣 `inventory_items.current_qty`（否则撤销/改配会很麻烦）

- **步骤 4：装柜（Loaded）**
  - **写**：更新 `inventory_allocations.loaded_qty` 与 `status='LOADED'`
  - **写（可选）**：`cargo_items`
    - 用于生成装箱单/清单：把本柜各品名/件毛体/唛头按业务口径汇总后落库

- **步骤 5：出库确认（Shipped：最终扣库存）**
  - **写**：更新 `inventory_allocations.shipped_qty` 与 `status='SHIPPED'`
  - **写（关键）**：`inventory_movements`
    - `ref_type='SHIP'`
    - `ref_id=inventory_allocations.id`（推荐，用于追溯到“哪次出库”）
    - `qty_delta = -shipped_qty`
  - **写（关键）**：更新 `inventory_items.current_qty = current_qty - shipped_qty`
  - **写（可选）**：更新 `warehouse_receipts.status`
    - 若该 receipt 下所有 `inventory_items.current_qty = 0` → `SHIPPED`
    - 否则 → `PARTIAL`

#### 撤销/冲销（建议）

- **撤销分配**：将 `inventory_allocations.status='CANCELLED'`，并确保 `shipped_qty=0`（若已出库则走冲销）
- **冲销出库**：写一条 `inventory_movements` 反向流水（`qty_delta=+x`），并把 `inventory_items.current_qty` 加回；同时修正 `inventory_allocations` 状态/数量

### 常用查询（你会用到的表）

- **按业务单看柜与柜内清单**：`shipments` → `containers` → `cargo_items`
- **按业务单看“从仓库出了哪些库存批次、各出多少”**：`shipments` → `inventory_allocations` → `inventory_items`
- **按库存批次看“都分配/出库到哪里了”**：`inventory_items` → `inventory_allocations`（按 status/qty 字段）
- **按库存批次审计数量变动**：`inventory_items` → `inventory_movements`（按时间排序）


