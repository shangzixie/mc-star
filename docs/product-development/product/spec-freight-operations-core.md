# Product Spec - Freight Operations Core

## Purpose

定义当前项目作为发货管理系统的核心业务范围：入库、库存、出货、装柜，以及必要单证协同。

## Core Users

- 内部业务员
- 客服 / 跟单
- 仓库操作人员
- 管理人员

系统默认不是给技术人员使用，因此交互必须简单、直观、低培训成本。

## Scope

包含：

- 主数据维护
- 入库单创建与补录
- 入库明细形成库存批次
- 发货单与柜管理
- 基于库存的出货分配、拣货、装柜、出库
- 基础单证与附件归档

不包含：

- 财务结算闭环
- 客户对外自助门户
- 高复杂度自动化流程

## Core Product Rules

### 1. Inventory Is The Source Of Truth

库存事实以 `inventory_items` 与 `inventory_movements` 为准。

### 2. Outbound Requires Explicit States

出货必须通过明确阶段推进，而不是一次性黑盒扣库存。

当前主状态：

- `ALLOCATED`
- `PICKED`
- `LOADED`
- `SHIPPED`
- `CANCELLED`

### 3. Frontend Must Reduce Operator Burden

前端交互遵循以下原则：

- 最小必填先创建，再补录
- 详情页分区块编辑
- 列表页优先支持搜索、筛选、状态查看
- 避免依赖隐蔽入口和复杂操作手势

### 4. Database Design Has Higher Priority Than Decorative UI

涉及新功能时，优先澄清：

- 新增对象是否真的需要单独建表
- 数量变化是否可追溯
- 状态是否单向推进
- 是否会引入重复事实源

## Reference Documents

- 数据模型与流程说明：`docs/RELATIONS.md`
- 后端与 API 现状：`docs/FREIGHT_BACKEND.md`
- 入库交互补强：`docs/FREIGHT_INBOUND_CREATE_FLOW_TODO.md`
