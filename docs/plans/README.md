# Freight Management Plans

本目录用于给 agent 建立任务约束、边界和优先级。

## Required Baseline

所有任务都必须先读：

1. [Part 01 - Mission and Scope](./part-01-mission-and-scope.md)
2. 本文件

只有当任务涉及 MVP 范围、交付优先级或核心链路边界时，才继续读取：

1. [Part 02 - MVP](./part-02-mvp.md)

随后按 `docs/product-development/README.md` 的 MOC 规则补读相关文档，不做全量扫描。

## Rule

开始实现前，必须先阅读与任务相关的权威文档，并优先更新原文档，而不是新增平行说明。

文档只记录业务目标、边界、决策、状态约束和跨模块契约；具体字段映射、组件实现、查询细节、兼容分支等可直接从代码确认的信息，不应写入长期权威文档。

如果需要判断该读哪些文档，按 MOC（Mode of Context，任务上下文模式）执行：

1. `Product MOC`：业务范围、用户流程、交互原则，只读 `product/` 中相关主题。
2. `Handoff MOC`：准备实现或验收某个功能，读相关 `product/` 和 `handoff/`。
3. `Coding MOC`：修改 schema、API、状态机、库存扣减等跨模块契约，读相关 `product/`、`handoff/` 和 `coding/`。
4. `Maintenance MOC`：修 bug、重构、样式微调、测试修复，先读宪法和本文件，再只读直接相关文档；若不改变业务边界或契约，不需要补读三层文档。

## Protected Docs

以下文件默认只读：

1. `docs/plans/part-01-mission-and-scope.md`
2. 根目录 `AGENTS.md`
