# Coding Contract - Freight Data Model v0

## Purpose

定义发货管理系统当前实现必须遵守的数据对象、状态边界和技术约束。

## Authoritative References

- 关系与流程（历史归档）：`docs/archive/RELATIONS.md`
- 后端与 API（历史归档）：`docs/archive/FREIGHT_BACKEND.md`
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
- `warehouse_receipts.status` 统一使用 `INBOUND | OUTBOUND | VOID`
- 新建入库单默认状态必须为 `INBOUND`
- `warehouse_receipts.receipt_no` 是可修正业务标识；在单据未进入 `OUTBOUND` 前允许通过 PATCH 更新，但仍保持唯一约束
- `warehouse_receipts.inbound_time` 允许在详情页编辑（ISO datetime 输入）
- `warehouse_receipts.air_type` 仅用于空运单，枚举值 `AIR | EXPRESS | H.K`
- `warehouse_receipts.courier_tracking_no` 与 `warehouse_receipts.courier_received_at` 作为单票单条快递信息
- 联系资料电话落在 `warehouse_receipts.customer_phone | shipper_phone | booking_agent_phone | customs_agent_phone`

### Allocation / Outbound

- 出货状态按 `ALLOCATED -> PICKED -> LOADED -> SHIPPED`
- `CANCELLED` 仅用于未完成出库的撤销
- `picked_qty <= allocated_qty`
- `loaded_qty <= picked_qty`
- `shipped_qty <= loaded_qty`
- 最终库存扣减发生在 `SHIPPED`
- 任何 `SHIPPED` 扣库存完成后，必须同步触发所属 `warehouse_receipts` 状态重算

## Frontend Constraints

- 面向非技术用户，优先表单、表格、显式操作按钮
- 复杂字段允许分区块保存，不要求一次性提交全部内容
- 详情页要明确显示状态、数量和剩余库存
- 详情页返回操作应优先 `router.back()`，无历史时再回落到列表 URL
- 集拼出库 sidebar 的“合并创建”运输类型选项必须限制为 `SEA_LCL`
- 普通入库/总操作入口的运输类型选项必须排除 `SEA_LCL`，避免与集拼合并创建入口重叠
- 联系资料区块需展示并编辑各合作方电话字段
- 快递信息通过独立卡片+弹窗编辑，不并入费用表格行模型
- HBL 前端移除 `placeOfReceipt` 输入；MBL 前端移除 `portOfDestinationAddress` 与 `placeOfReceipt` 输入
- 组合框（combobox）中的本地缓存同步 effect 必须避免“每次 render 都 setState”，派生数组依赖需 `useMemo` 或做变更检测，防止 `Maximum update depth exceeded`
- freight 详情页应优先复用模块级布局组件表达“信息轨道 + 主工作区”关系，避免在业务页直接堆叠一次性 `grid-cols-[...]` 导致编排难以维护

## Backend Implementation Constraints

- `src/app/api/freight/**` Route Handler 负责鉴权、参数解析、错误包裹
- 业务写操作（创建、状态推进、扣减、联动更新）优先放在 `src/lib/freight/services/**`
- 同一业务动作的写规则不能在多个 Route 中重复实现
- `PATCH /api/freight/warehouse-receipts/:id` 必须接受 `receiptNo` 的合法更新，并沿用现有 `OUTBOUND` 编辑锁定规则
- `POST /api/freight/warehouse-receipts/merge` 必须在服务端拒绝非 `SEA_LCL` 的 `transportType`
- `warehouse_receipts` 新增字段必须同步更新：schema、zod schema、api types、api client、route select/update 映射
- `warehouse_receipts` 新字段兼容降级判定必须同时识别 `warehouse_receipts.<column> does not exist` 与 `column "<column>" does not exist` 两种数据库错误文本
- 缺列降级逻辑不得强依赖 SQLSTATE `42703`；若 error code 缺失但缺列文本匹配，仍必须触发降级分支
- 缺列降级逻辑需检查错误包装链上的 `message/code`（包括 `cause`），避免驱动包装后漏掉 `warehouse_receipts` 新字段兼容分支
- `warehouse_receipts` 兼容降级重试若涉及 `insert/update ... returning(...)`，必须同时剔除写入值与返回字段中的缺失列；只去掉 `values/set` 不足以避免 PostgreSQL 再次报缺列
- Supabase 数据迁移脚本必须兼容 pooler 连接（`*.pooler.supabase.com:6543`）与直连（`db.<ref>.supabase.co:5432`），并优先允许通过完整 URL 配置连接参数
- 当前默认 Supabase 目标环境（2026-04-25）为 `ofndvijutedbjpccnmqq`（`aws-1-ap-northeast-1.pooler.supabase.com:6543`）；旧环境 `aqokzwbthhaywigdnapb` 仅用于迁移源，不应继续作为应用默认写入库

## Documentation Rule

涉及以下变化时，必须先更新对应文档再改代码：

- 新增 freight 核心表
- 修改出货状态机
- 修改库存扣减时机
- 新增非技术用户必须学习的新交互模型
