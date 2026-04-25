# Development Handoff Markdown Template

本模板只记录产品到实现的交接边界，不记录代码级实现细节。

## Goal

一句话说明功能提供什么能力，以及它位于发货管理哪段链路。

## Scope

- 适用角色
- 所属阶段
- 与哪些已有能力相关

## Delivery Surface

- 页面：
- API：
- 其他：

## Preconditions / State Requirements

- 需要哪些主数据
- 依赖哪些状态
- 是否有角色限制

## Input

必填：
- `...`

可选：
- `...`

## Validation Rules

1. 参数与字段约束
2. 状态前置条件
3. 异常与冲突规则
4. 必须由服务端保证的规则

## Output / State Changes

成功：
- `...`

失败：
- `400`
- `403`
- `404`
- `409`

## UX Notes

1. 非技术用户优先
2. 表单与表格优先
3. 关键动作要有明确按钮和反馈

## Acceptance

1. happy path
2. 至少 1 个关键冲突场景
3. 至少 1 个校验场景

## Do Not Include

- 组件内部结构、hook 写法、CSS 细节
- route 查询字段、select/update 映射、错误包装链
- 一次性 bugfix 过程和临时兼容分支
- 环境地址、数据库连接参数、部署流水账
