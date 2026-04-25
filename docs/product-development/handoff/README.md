# Product-To-Coding Handoff

本目录用于记录产品到实现的交接文档。

## Rule

- 只有准备进入实现、验收或跨角色交接的功能，才需要 handoff 文档
- 如果相关 handoff 文档不存在，agent 应先补齐最小交接内容，再开始代码修改
- handoff 文档允许直接更新；默认只读边界仅包括 `docs/plans/part-01-mission-and-scope.md` 与根目录 `AGENTS.md`

## Content Boundary

handoff 文档应描述交付目标、用户路径、输入输出、状态前置条件和验收边界。

不要在 handoff 中记录代码级实现细节，例如组件结构、查询字段、具体错误包装、临时兼容逻辑或某次 bugfix 的技术过程。这些内容应留在代码、测试、迁移或短期 issue 中。
