# mc-star

内部发货管理系统，基于 Next.js 部署到 Vercel。

## 当前定位

- 入库、库存、发货、装柜主链路
- 面向内部运营人员的低成本后台
- 数据库与状态约束优先于前端包装

## 开发

```bash
pnpm install
pnpm dev
```

## 常用命令

```bash
pnpm build
pnpm lint
pnpm db:generate
pnpm db:migrate
pnpm db:push
```

## 文档

- 宪法与执行协议：`AGENTS.md`
- 计划层：`docs/plans/`
- 三层产品文档：`docs/product-development/`
- 现有货代技术文档：`docs/RELATIONS.md`、`docs/FREIGHT_BACKEND.md`
