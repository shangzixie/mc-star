# Freight Product Development

本目录是产品设计进入实现前后的总入口。
所有 agent 在开始实现前，都必须先按三层结构进入相关文档。

## Three Layers

1. `product/`
   - 定义业务能力、对象、规则和边界
   - 回答“这个功能是什么，为什么存在”

2. `handoff/`
   - 定义产品到开发的交接方式
   - 回答“这个功能要如何交给实现”

3. `coding/`
   - 定义 schema、API、状态机和前端实现约束
   - 回答“实现时必须遵守什么事实”

## Reading Order

1. 先读相关 `docs/plans/`
2. 再读本页
3. 进入相关 `product/*.md`
4. 进入相关 `handoff/*.md`
5. 最后进入相关 `coding/*.md`

## Documentation Governance

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
