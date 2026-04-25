# Coding Contract - Freight Data Model v0

## Purpose

定义发货管理系统当前实现必须遵守的数据对象、状态边界和跨模块技术契约。

本文件不是实现索引，不记录 route 内部字段映射、组件细节、临时兼容分支或具体环境地址。需要确认代码事实时，直接读对应 schema、API、service、测试和迁移。

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
- 货物改包创建的新入库单默认 `INBOUND`，被选择的旧入库单必须转为 `OUTBOUND`
- `warehouse_receipts.receipt_no` 是可修正业务标识；在单据未进入 `OUTBOUND` 前允许通过 PATCH 更新，但仍保持唯一约束
- `warehouse_receipts.inbound_time` 允许在详情页编辑（ISO datetime 输入）
- `warehouse_receipts.air_type` 仅用于空运单，枚举值 `AIR | EXPRESS | H.K`
- `warehouse_receipts.courier_tracking_no` 与 `warehouse_receipts.courier_received_at` 作为单票单条快递信息
- 联系资料电话落在 `warehouse_receipts.customer_phone | shipper_phone | booking_agent_phone | customs_agent_phone`
- 批量修改客户的默认语义是更新 `warehouse_receipts.customer_id` 与单据侧联系资料字段，不反向改写 `parties` 主数据

### Allocation / Outbound

- 出货状态按 `ALLOCATED -> PICKED -> LOADED -> SHIPPED`
- `CANCELLED` 仅用于未完成出库的撤销
- `picked_qty <= allocated_qty`
- `loaded_qty <= picked_qty`
- `shipped_qty <= loaded_qty`
- 最终库存扣减发生在 `SHIPPED`
- 任何 `SHIPPED` 扣库存完成后，必须同步触发所属 `warehouse_receipts` 状态重算
- 货物改包是库存转移动作，不经过出货状态机；旧库存扣减和新库存生成必须写入 `inventory_movements`
- 入库单父子关系必须区分集拼合并与货物改包，避免两类流程共享关系表时语义混淆
- 货物改包新单的 `inventory_items` 是独立可编辑库存批次；旧单明细只保留来源追溯语义，不能被新单编辑反写

## Frontend Constraints

- 面向非技术用户，优先表单、表格、显式操作按钮
- 复杂字段允许分区块保存，不要求一次性提交全部内容
- 详情页要明确显示状态、数量和剩余库存
- 详情页返回操作应优先 `router.back()`，无历史时再回落到列表 URL
- 集拼出库 sidebar 的“合并创建”运输类型选项必须限制为 `SEA_LCL`
- 普通入库/总操作入口的运输类型选项必须排除 `SEA_LCL`，避免与集拼合并创建入口重叠
- 总操作入口的货物改包应作为创建模式呈现，不加入运输类型选项
- 货物改包父单详情页应优先展示当前单自己的可编辑明细；旧单关联只用于来源跳转和审计追溯
- 联系资料区块需展示并编辑各合作方电话字段
- 快递信息在入库详情页中并入船期区块，位于库房名称下方，不再保留独立快递信息卡片
- 入库详情头部布局中，入库明细表需横跨右侧剩余列，避免在大屏下停在中间造成右侧空白
- HBL 前端移除 `placeOfReceipt` 输入；MBL 前端移除 `portOfDestinationAddress` 与 `placeOfReceipt` 输入
- freight 详情页应使用稳定、可复用的信息区块表达业务关系，避免一次性布局造成维护成本
- 入库总列表允许进入统一的批量编辑选择模式；批量写入必须通过显式确认对话框触发
- 批量修改联系电话等可选字段时，前端必须显式标记哪些字段参与本次更新，未启用字段不得发送覆盖值

## Backend Implementation Constraints

- `src/app/api/freight/**` Route Handler 负责鉴权、参数解析、错误包裹
- 业务写操作（创建、状态推进、扣减、联动更新）优先放在 `src/lib/freight/services/**`
- 同一业务动作的写规则不能在多个 Route 中重复实现
- `PATCH /api/freight/warehouse-receipts/:id` 必须接受 `receiptNo` 的合法更新，并沿用现有 `OUTBOUND` 编辑锁定规则
- `POST /api/freight/warehouse-receipts/merge` 必须在服务端拒绝非 `SEA_LCL` 的 `transportType`
- `POST /api/freight/warehouse-receipts/repack` 必须在同一事务中完成新单创建、旧库存扣减、新库存生成、状态日志和父子关系记录
- `POST /api/freight/warehouse-receipts/batch-update` 必须对每张单据逐条执行服务端校验并返回逐条结果；不得因为单条失败而静默吞掉整批状态
- 批量状态修改必须沿用既有 `warehouse_receipt_status_logs` 写入规则；涉及父子单联动时应复用现有状态联动逻辑，而不是前端自行推断
- `OUTBOUND` 编辑锁定规则对批量修改同样生效；仅显式允许的字段可以在锁定状态下更新
- freight schema 变化必须同步更新校验、类型、API client、服务写入逻辑和测试
- `POST /api/freight/warehouse-receipts/export` 是只读导出接口，必须鉴权并只允许导出 `INBOUND` 现有库存单据；不得写入库存、状态、流水或业务单据
- 迁移与兼容逻辑必须以不破坏既有页面加载和写入为目标；具体缺列识别与重试细节以代码和测试为准
- 数据库连接、目标环境和迁移参数属于配置或运维信息，不写入长期契约文档

## Documentation Rule

涉及以下变化时，必须先更新对应文档再改代码：

- 新增 freight 核心表
- 修改出货状态机
- 修改库存扣减时机
- 新增非技术用户必须学习的新交互模型
