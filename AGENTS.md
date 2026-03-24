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

开始编码前，agent 必须：

1. 阅读 `docs/plans/README.md`
2. 阅读 `docs/plans/part-01-mission-and-scope.md`
3. 阅读 `docs/product-development/README.md`
4. 阅读相关 `docs/product-development/product/`
5. 阅读相关 `docs/product-development/handoff/`
6. 阅读相关 `docs/product-development/coding/`
7. 先更新相关文档
8. 再开始代码修改

## 4) Protected Docs

以下文件属于治理边界，默认只读：

- 根目录 `AGENTS.md`
- `docs/plans/part-01-mission-and-scope.md`

除非项目所有者明确授权，否则不得修改。
