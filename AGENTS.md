# Agent Constitution & Execution Protocol

在开始实现前，agent 必须先阅读并更新与任务相关的文档，再进入代码修改。

## 1) Constitution Source (Highest Priority)

项目宪法文件：

- `docs/plans/part-01-mission-and-scope.md`

所有任务都必须先按这份文档解释，再进入设计和实现。

## 2) Instruction Priority

发生冲突时，按以下优先级执行：

1. 宪法：`docs/plans/part-01-mission-and-scope.md`
2. 已确认的计划文档：`docs/plans/`
3. 三层产品文档：`docs/product-development/`
4. 用户当前任务要求
5. 局部实现偏好

若文档与代码事实不一致，应先更新文档，再调整实现；若仍有歧义，应停止猜测并向项目所有者确认。

## 3) Documentation-First Rule

开始编码前，agent 必须按 MOC（Mode of Context，任务上下文模式）读取文档：

1. 阅读 `docs/plans/README.md`
2. 阅读 `docs/plans/part-01-mission-and-scope.md`
3. 阅读 `docs/product-development/README.md`
4. 根据当前任务所属 MOC，只补读相关 `product/`、`handoff/`、`coding/` 文档
5. 先更新相关权威文档
6. 再开始代码修改

默认不做全量 docs 扫描。只有当任务改变业务对象、状态机、库存扣减时机、跨模块契约或用户必须学习的新流程时，才进入更重的 handoff/coding 文档读取。

## 4) Protected Docs

以下文件属于治理边界，默认只读：

- 根目录 `AGENTS.md`
- `docs/plans/part-01-mission-and-scope.md`

除非项目所有者明确授权，否则不得修改。
