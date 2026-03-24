# Part 01 - Mission and Scope

## Mission

本项目是一个面向内部运营团队的发货管理系统，覆盖入库、库存、出货、装柜与单证协同。

系统目标不是做通用 ERP，而是先把发货出货主链路做稳定、可追溯、可低成本维护。

## Product Boundary

系统优先服务以下核心业务对象：

- 入库单 `warehouse_receipts`
- 库存批次 `inventory_items`
- 发货单 / 业务单 `shipments`
- 柜 `containers`
- 库存分配与出货记录 `inventory_allocations`
- 库存流水 `inventory_movements`
- 单证与附件 `attachments`

当前范围内必须优先保证：

- 入库到库存形成闭环
- 出货与装柜有明确状态推进
- 库存扣减可审计、可回溯
- 非技术人员可以通过低学习成本的界面完成主要录入与查询

当前范围外，不应在没有明确授权时自行扩展：

- 复杂财务结算
- 高度定制化流程引擎
- 实时协同或复杂自动化编排
- 面向外部客户的完整门户系统

## Operating Principles

### 1. Database First

涉及入库、库存、出货的能力，先明确数据模型与状态边界，再做前端交互。

### 2. Auditability Over Cleverness

库存变化必须可回溯；数量变化优先通过明确流水和状态推进表达，不用隐式计算掩盖事实。

### 3. Low-Cost Frontend

前端默认采用低成本、易培训、表单和表格优先的内部工具风格：

- 优先 CRUD、步骤化录入、清晰状态标签
- 避免过度动画、复杂拖拽、隐藏式交互
- 优先让业务员“少出错”，不是追求炫技界面

### 4. Documentation Before Code

新增功能或修改主链路时，必须先更新三层文档，再改代码。

## Acceptance Standard

一个方案只有在同时满足以下条件时才算合格：

1. 能说明对哪段业务链路负责
2. 能落到明确表结构或状态约束
3. 能被非技术人员以低培训成本使用
4. 能在文档中找到权威入口与交付边界
