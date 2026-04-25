# Freight Product Development

本目录是产品设计进入实现前后的总入口。
agent 不需要每次读取所有产品文档；应先判断任务属于哪种 MOC，再只读相关主题。

## Three Layers

1. `product/`
   - 定义业务能力、对象、规则和边界
   - 回答“这个功能是什么，为什么存在”

2. `handoff/`
   - 定义产品到开发的交接方式
   - 回答“这个功能要如何交给实现”

3. `coding/`
   - 定义跨模块技术契约、状态机和不可破坏的不变量
   - 回答“实现时不能违反什么事实”

## MOC Reading Protocol

MOC 是 Mode of Context，用于决定 agent 需要加载多少文档。

| MOC | 适用任务 | 必读文档 | 不需要读 |
| --- | --- | --- | --- |
| `Product MOC` | 梳理需求、改业务描述、讨论流程 | `docs/plans/part-01-mission-and-scope.md`、本页、相关 `product/*.md` | `handoff/`、`coding/` |
| `Handoff MOC` | 准备实现、写验收、确认交付面 | Product MOC + 相关 `handoff/*.md` | 不相关功能文档 |
| `Coding MOC` | 改 schema、API、库存状态、跨模块契约 | Handoff MOC + 相关 `coding/*.md` | 历史归档和无关实现记录 |
| `Maintenance MOC` | 修 bug、重构、样式微调、测试修复 | 宪法、本页、直接相关文档 | 全量三层文档 |

如果任务只影响局部代码，且不改变业务对象、状态推进、库存扣减时机或用户必须学习的新流程，可使用 `Maintenance MOC`。

如果阅读过程中发现文档与代码事实不一致，先更新权威文档，再调整实现；若冲突涉及受保护文档，停止并向项目所有者确认。

## Documentation Depth

长期文档应该写“为什么”和“不能破坏什么”，不要写“代码现在怎么写”。

应该保留：

- 业务目标、范围和明确不做的事
- 状态机、库存审计、数据来源等不变量
- 跨页面、API、服务之间的契约
- 非技术用户必须理解的交互规则
- 影响验收的边界条件

不应保留：

- 具体组件名、hook 写法、CSS/grid 细节
- Route handler 内部映射、查询字段清单、fallback 分支细节
- 一次性 bug 修复记录
- 当前环境地址、临时迁移策略、可从代码或配置直接读取的信息
- 与主链路无关的历史实现流水账

## Governance

- `docs/plans/part-01-mission-and-scope.md` 与根目录 `AGENTS.md` 默认只读
- 其他产品、交接、技术文档允许直接更新
- 涉及既有主题变化时，优先更新原权威文档，不新增平行版本

## Naming Rules

- 产品功能文档：`product/spec-<feature>.md`
- 开发交接文档：`handoff/dev-<feature>.md`
- 技术契约文档：`coding/contract-<feature>-v0.md`

## Current Documents

### Product

1. [Freight Operations Core](./product/spec-freight-operations-core.md)

### Handoff

1. [Handoff Rules](./handoff/README.md)
2. [Freight Operations Core Handoff](./handoff/dev-freight-operations-core.md)

### Coding

1. [Freight Data Model Contract v0](./coding/contract-freight-data-model-v0.md)

## Coverage Tracker

| Feature | Product | Handoff | Coding | Status |
| --- | --- | --- | --- | --- |
| 发货管理主链路（入库/库存/出货/装柜） | `product/spec-freight-operations-core.md` | `handoff/dev-freight-operations-core.md` | `coding/contract-freight-data-model-v0.md` | 已建立三层骨架，后续按具体子功能继续细化 |
