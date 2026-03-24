# Part 02 - MVP

## MVP Goal

MVP 聚焦一个内部可用的发货管理后台，先跑通最小业务闭环：

1. 建立主数据
2. 创建入库单并形成库存批次
3. 基于库存做出货分配、拣货、装柜、出库
4. 保留必要附件与单证信息
5. 让运营人员能查询当前库存和发货状态

## MVP In Scope

- 主数据：合作方、运输节点、仓库
- 入库单与库存批次
- 发货单与柜
- 四阶段出货状态：`ALLOCATED -> PICKED -> LOADED -> SHIPPED`
- 库存流水审计
- 基础附件归档
- 面向内部运营的低成本表单/列表界面

## MVP Out Of Scope

- 复杂计费和应收应付
- 高级报表系统
- 自动排仓、智能推荐、复杂规则引擎
- 对外客户自助门户

## Implementation Bias

### Backend

- 先保证 schema、约束、状态机正确
- 所有数量逻辑优先在后端校验
- 不允许前端自行推断关键库存事实

### Frontend

- 单页表单 + 表格 + 明确按钮优先
- 创建流程尽量拆成最少必填后再补录
- 复杂对象通过分区块编辑，不强求一次填完

## Existing Detailed References

- 数据关系：`docs/RELATIONS.md`
- 出货后端与 API：`docs/FREIGHT_BACKEND.md`
- 入库补强待办：`docs/FREIGHT_INBOUND_TODO.md`
- 入库创建交互：`docs/FREIGHT_INBOUND_CREATE_FLOW_TODO.md`
- MBL 实现记录：`docs/MBL_IMPLEMENTATION.md`
- 员工分配实现记录：`docs/EMPLOYEE_ASSIGNMENTS_IMPLEMENTATION.md`
