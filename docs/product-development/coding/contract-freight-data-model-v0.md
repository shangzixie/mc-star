# Coding Contract - Freight Data Model v0

## Purpose

定义发货管理系统当前实现必须遵守的数据对象、状态边界和技术约束。

## Authoritative References

- 关系与流程：`docs/RELATIONS.md`
- 后端与 API：`docs/FREIGHT_BACKEND.md`
- 当前实现入口：`src/db/schema.ts`、`src/app/api/freight/**`

## Core Aggregates

### Master Data

- `parties`
- `transport_nodes`
- `warehouses`

### Inventory

- `warehouse_receipts`
- `inventory_items`
- `inventory_movements`

### Outbound

- `shipments`
- `containers`
- `inventory_allocations`
- `cargo_items`

### Documents

- `attachments`
- `master_bills_of_lading`

## Required State Rules

### Inventory

- `inventory_items.initial_qty` 是入库基线
- `inventory_items.current_qty` 是当前库存余额
- `inventory_movements` 是审计流水，不应缺失关键入库/出库记录

### Allocation / Outbound

- 出货状态按 `ALLOCATED -> PICKED -> LOADED -> SHIPPED`
- `CANCELLED` 仅用于未完成出库的撤销
- `picked_qty <= allocated_qty`
- `loaded_qty <= picked_qty`
- `shipped_qty <= loaded_qty`
- 最终库存扣减发生在 `SHIPPED`

## Frontend Constraints

- 面向非技术用户，优先表单、表格、显式操作按钮
- 复杂字段允许分区块保存，不要求一次性提交全部内容
- 详情页要明确显示状态、数量和剩余库存

## Documentation Rule

涉及以下变化时，必须先更新对应文档再改代码：

- 新增 freight 核心表
- 修改出货状态机
- 修改库存扣减时机
- 新增非技术用户必须学习的新交互模型
