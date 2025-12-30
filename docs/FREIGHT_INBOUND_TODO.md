# 货代入库系统功能缺失清单与修复计划

> **生成时间**: 2025-12-30
> **目的**: 系统化梳理当前入库模块的功能缺失,按优先级逐步修复

---

## 当前状态总结

### ✅ 已实现功能
- 入库单列表查询 (带搜索)
- 创建入库单 (receiptNo/warehouse/customer/remarks)
- 查看入库单详情
- 添加商品明细到入库单
- 后端 GET/POST/PATCH/DELETE 端点完整
- 库存流水记录 (inventory_movements)
- 删除入库单的安全检查 (已分配/已出库的不能删)

### ❌ 功能缺失（需修复）
本文档列出了 **8 大类、27 个具体缺失点**，按优先级分为 P0/P1/P2 三档。

---

## 🔴 P0 - 必须立即修复（阻塞业务）

### 1. 入库单详情页缺少操作入口 ⚠️

**问题描述**:
- 当前入库单详情页只能"查看+添加商品"
- 虽然后端提供了 PATCH/DELETE 端点，前端也有 `EditReceiptDialog` / `DeleteConfirmDialog` 组件
- **但没有按钮触发这些功能**

**文件位置**:
- 前端组件: `src/components/freight/inbound/freight-inbound-page-client.tsx` (第310-516行 `ReceiptDetailView`)
- 后端 API: `src/app/api/freight/warehouse-receipts/[id]/route.ts` (PATCH/DELETE 已实现)

**需要修复**:
```typescript
// 在 ReceiptDetailView 的 Header 区域添加操作菜单 (DropdownMenu)
<div className="flex items-center gap-4">
  <Button variant="ghost" size="icon" onClick={onBack}>
    <ArrowLeft />
  </Button>
  <div className="flex-1">
    <h1>{receipt.receiptNo}</h1>
    <Badge>{receipt.status}</Badge>
  </div>

  {/* 🔴 缺失：添加操作菜单 */}
  <DropdownMenu>
    <DropdownMenuTrigger>
      <Button variant="ghost" size="icon">
        <MoreHorizontal />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem onClick={() => setEditReceiptOpen(true)}>
        <Edit /> 编辑入库单
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setDeleteReceiptOpen(true)}>
        <Trash2 /> 删除入库单
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => /* 修改状态 */}>
        <RefreshCw /> 修改状态
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

**预期结果**:
- 点击"编辑"打开 `EditReceiptDialog`
- 点击"删除"打开 `DeleteConfirmDialog` 并调用 DELETE API
- 点击"修改状态"打开状态选择对话框

---

### 2. 库存明细表缺少操作列 ⚠️

**问题描述**:
- 商品明细表 (第407-509行) 只显示数据，**无法编辑/删除/查看流水**
- 虽然有 `EditItemDialog` / `DeleteConfirmDialog` / `InventoryMovementsDialog`
- **但没有触发入口**

**需要修复**:
```typescript
// 在 ReceiptDetailView 的 TableHeader 添加"操作"列
<TableHeader>
  <TableRow>
    <TableHead>商品名称</TableHead>
    <TableHead>SKU</TableHead>
    <TableHead className="text-right">数量</TableHead>
    <TableHead>单位</TableHead>
    <TableHead>库位</TableHead>
    <TableHead className="text-right">重量</TableHead>
    <TableHead className="text-right">尺寸</TableHead>
    <TableHead className="w-[100px]">操作</TableHead> {/* 🔴 新增 */}
  </TableRow>
</TableHeader>

// 在 TableBody 每行末尾添加操作按钮
<TableCell>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon">
        <MoreHorizontal className="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => { setSelectedItem(item); setEditItemOpen(true); }}>
        <Edit className="size-4" /> 编辑
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => { setSelectedItem(item); setMovementsOpen(true); }}>
        <History className="size-4" /> 查看流水
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => { setSelectedItem(item); setDeleteItemOpen(true); }}>
        <Trash2 className="size-4" /> 删除
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</TableCell>
```

**预期结果**:
- 每行商品都有操作按钮
- 点击"编辑"打开 `EditItemDialog`
- 点击"查看流水"打开 `InventoryMovementsDialog`
- 点击"删除"打开确认对话框并调用 DELETE API

---

### 3. 不显示当前剩余库存 (current_qty) ⚠️

**问题描述**:
- 商品明细表只显示 `initialQty` (入库数量)
- **不显示 `currentQty` (当前剩余库存)**
- 无法判断该批次是否已部分/全部出库

**文件位置**:
- 数据库字段: `inventory_items.current_qty`
- API 返回: `src/app/api/freight/inventory-items/route.ts` (已返回 currentQty)
- 前端显示: `src/components/freight/inbound/freight-inbound-page-client.tsx` (第407-509行)

**需要修复**:
```typescript
// 修改表头
<TableHead className="text-right">入库数量</TableHead>
<TableHead className="text-right">剩余库存</TableHead> {/* 🔴 新增 */}
<TableHead className="text-right">已出库</TableHead>   {/* 🔴 新增 */}

// 修改表格数据行
<TableCell className="text-right font-medium">
  {item.initialQty}
</TableCell>
<TableCell className="text-right font-medium">
  <span className={cn(
    item.currentQty === 0 && "text-muted-foreground",
    item.currentQty > 0 && item.currentQty < item.initialQty && "text-yellow-600"
  )}>
    {item.currentQty}
  </span>
</TableCell>
<TableCell className="text-right text-muted-foreground">
  {item.initialQty - item.currentQty}
</TableCell>
```

**预期结果**:
- 显示"入库数量 / 剩余库存 / 已出库"三列
- 剩余为 0 时显示灰色
- 部分出库时显示黄色预警

---

### 4. 入库单列表缺少状态筛选 ⚠️

**问题描述**:
- 列表页只有搜索框，**没有状态筛选下拉框**
- 无法快速筛选"已完全出库 (SHIPPED)" / "部分出库 (PARTIAL)" / "未出库 (RECEIVED)"

**文件位置**:
- `src/components/freight/inbound/freight-inbound-page-client.tsx` (第156-308行 `ReceiptListView`)
- 参考实现: `src/components/freight/shipments/shipments-page-client.tsx` (第37-48行)

**需要修复**:
```typescript
// 在 ReceiptListView 添加状态筛选
import { RECEIPT_STATUSES } from '@/lib/freight/constants';

function ReceiptListView() {
  const [searchQ, setSearchQ] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // 🔴 新增

  const receiptsQuery = useFreightWarehouseReceipts({
    q: searchQ,
    status: statusFilter // 🔴 传递给 API
  });

  return (
    <div className="space-y-4">
      {/* Search Bar + Status Filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} />
        </div>

        {/* 🔴 新增状态筛选 */}
        <select
          className="h-9 rounded-md border bg-background px-3 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">全部状态</option>
          {RECEIPT_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      {/* ... 表格 */}
    </div>
  );
}
```

**预期结果**:
- 下拉框显示: 全部状态 / RECEIVED / SHIPPED / PARTIAL
- 选择后调用 API: `/api/freight/warehouse-receipts?status=RECEIVED`

---

### 5. 状态 Badge 没有颜色区分 ⚠️

**问题描述**:
- 入库单列表和详情页的状态显示为 `<Badge variant="outline">{status}</Badge>`
- **所有状态颜色相同**，无法快速识别

**需要修复**:
```typescript
// 创建状态 Badge 组件 (参考 ShipmentStatusBadge)
function ReceiptStatusBadge({ status }: { status: string }) {
  const variant =
    status === 'SHIPPED' ? 'default' :
    status === 'PARTIAL' ? 'secondary' :
    'outline';

  return (
    <Badge variant={variant} className={cn(
      status === 'SHIPPED' && 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      status === 'PARTIAL' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      status === 'RECEIVED' && 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
    )}>
      {status}
    </Badge>
  );
}
```

**预期结果**:
- RECEIVED: 蓝色 (待出库)
- PARTIAL: 黄色 (部分出库)
- SHIPPED: 绿色 (已完全出库)

---

## 🟡 P1 - 重要但不紧急（影响效率）

### 6. 入库单统计信息缺失 ⚠️

**问题描述**:
- 详情页不显示汇总统计: 总件数、总重量、总体积、总商品行数
- 无法快速了解入库单规模

**需要修复**:
```typescript
// 在 ReceiptDetailView 的"入库单信息卡片"下方添加统计卡片
<div className="grid gap-4 md:grid-cols-4 rounded-lg border bg-card p-4">
  <div>
    <div className="text-muted-foreground text-xs font-medium uppercase">
      商品行数
    </div>
    <div className="mt-1 text-2xl font-bold">
      {receipt.stats?.totalItems ?? 0}
    </div>
  </div>
  <div>
    <div className="text-muted-foreground text-xs font-medium uppercase">
      总件数
    </div>
    <div className="mt-1 text-2xl font-bold">
      {receipt.stats?.totalQty ?? 0}
    </div>
  </div>
  <div>
    <div className="text-muted-foreground text-xs font-medium uppercase">
      总重量 (kg)
    </div>
    <div className="mt-1 text-2xl font-bold">
      {receipt.stats?.totalWeight?.toFixed(2) ?? 0}
    </div>
  </div>
  <div>
    <div className="text-muted-foreground text-xs font-medium uppercase">
      剩余库存
    </div>
    <div className="mt-1 text-2xl font-bold">
      {receipt.stats?.remainingQty ?? 0}
    </div>
  </div>
</div>
```

**后端支持**:
- API 已返回 `stats` 对象 (第90-92行):
  ```typescript
  const stats = await getReceiptStats(receiptId, db);
  return jsonOk({ data: { ...receipt, stats } });
  ```
- 需确认 `getReceiptStats` 函数实现

---

### 7. 库存占用情况不可见 ⚠️

**问题描述**:
- 不知道某批次库存被哪些业务单占用/分配
- 无法追溯"为什么剩余库存减少了"

**需要修复**:
在商品明细的"操作"菜单中添加"查看占用"选项:
```typescript
<DropdownMenuItem onClick={() => showAllocations(item.id)}>
  <Package className="size-4" /> 查看占用情况
</DropdownMenuItem>
```

创建 `AllocationsDialog` 组件:
```typescript
// 查询 inventory_allocations 表
GET /api/freight/allocations?inventoryItemId={itemId}

// 显示:
// - 业务单号 (jobNo)
// - 分配数量 (allocatedQty)
// - 状态 (ALLOCATED/PICKED/LOADED/SHIPPED)
// - 柜号 (containerNo)
```

---

### 8. 手动修改状态功能缺失 ⚠️

**问题描述**:
- 虽然后端 PATCH 端点支持修改状态
- 但前端**没有提供修改状态的 UI**

**需要修复**:
创建 `ChangeStatusDialog` 组件:
```typescript
function ChangeStatusDialog({
  open,
  onOpenChange,
  receipt
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: FreightWarehouseReceiptWithRelations;
}) {
  const [newStatus, setNewStatus] = useState(receipt.status);

  const onSubmit = async () => {
    await fetch(`/api/freight/warehouse-receipts/${receipt.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    toast.success('状态已更新');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>修改入库单状态</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>当前状态: {receipt.status}</Label>
          <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
            {RECEIPT_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <DialogFooter>
          <Button onClick={onSubmit}>确认修改</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 9. 入库时间显示不完整 ⚠️

**问题描述**:
- 列表只显示 `createdAt` (创建时间)
- 不显示 `inboundTime` (实际入库时间)
- 两者可能不同 (先创建单据,后实际入库)

**需要修复**:
```typescript
// 在入库单详情页显示两个时间
<div className="grid gap-4 md:grid-cols-4">
  <div>
    <div className="text-xs uppercase text-muted-foreground">创建时间</div>
    <div>{format(new Date(receipt.createdAt), 'yyyy-MM-dd HH:mm')}</div>
  </div>
  <div>
    <div className="text-xs uppercase text-muted-foreground">入库时间</div>
    <div>
      {receipt.inboundTime
        ? format(new Date(receipt.inboundTime), 'yyyy-MM-dd HH:mm')
        : '-'
      }
    </div>
  </div>
</div>
```

---

### 10. 搜索功能不够强大 ⚠️

**问题描述**:
- 当前搜索只匹配 `receiptNo` 和 `remarks`
- 不能搜索仓库名称、客户名称

**后端已支持**:
- API 的 `q` 参数已实现模糊搜索 (第41-46行)

**需优化**:
```sql
-- 后端 SQL 需改进: 添加 warehouse.name 和 parties.name_cn 的搜索
WHERE
  warehouse_receipts.receipt_no ILIKE '%q%'
  OR warehouse_receipts.remarks ILIKE '%q%'
  OR warehouses.name ILIKE '%q%'           -- 🔴 新增
  OR parties.name_cn ILIKE '%q%'           -- 🔴 新增
```

---

### 11. 编辑入库单时无法修改入库时间 ⚠️

**问题描述**:
- `EditReceiptDialog` 组件存在,但可能缺少 `inboundTime` 字段

**需要检查并补充**:
```typescript
// 在 EditReceiptDialog 表单中添加日期选择器
<div className="space-y-2">
  <Label htmlFor="inboundTime">入库时间</Label>
  <Input
    id="inboundTime"
    type="datetime-local"
    {...form.register('inboundTime')}
  />
</div>
```

---

## 🟢 P2 - 锦上添花（提升体验）

### 12. 批量导入商品明细 📊

**需求**:
- Excel 上传 → 批量新增 inventory_items
- 模板: 商品名称 | SKU | 数量 | 单位 | 库位 | 重量 | 长宽高

**参考实现**:
- 使用 `xlsx` 库解析 Excel
- 提供模板下载按钮
- 上传后批量调用 `POST /api/freight/warehouse-receipts/:id/items`

---

### 13. 打印/导出入库单 🖨️

**需求**:
- PDF 格式入库单 (用于纸质存档)
- Excel 导出商品明细

**实现方案**:
- PDF: 使用 `@react-pdf/renderer` 或 `puppeteer`
- Excel: 使用 `xlsx` 库

---

### 14. 入库单审核流程 ✅

**需求**:
- 新增状态: DRAFT (草稿) → PENDING (待审核) → APPROVED (已审核) → RECEIVED (已入库)
- 需要权限控制 (仅主管可审核)

**数据库变更**:
```sql
ALTER TABLE warehouse_receipts
  ADD COLUMN approved_by UUID REFERENCES users(id),
  ADD COLUMN approved_at TIMESTAMPTZ;
```

---

### 15. 库存预警 ⚠️

**需求**:
- 当某批次 `currentQty` 低于阈值时发送通知
- 配置: 每个客户/仓库可设置预警阈值

---

### 16. 自动状态计算 🤖

**需求** (参考 RELATIONS.md):
- 当 `inventory_allocations` 执行 SHIP 操作时
- 自动检查该入库单下所有 `inventory_items` 的 `current_qty`
- 如果全部为 0 → 更新 `warehouse_receipts.status = 'SHIPPED'`
- 如果部分为 0 → 更新为 'PARTIAL'

**实现位置**:
- `src/lib/freight/services/receipt-status.ts` 的 `updateReceiptStatus` 函数
- 在 `POST /api/freight/allocations/:id/ship` 中调用

---

### 17. 商品照片上传 📸

**需求**:
- 为每个 `inventory_item` 添加照片
- 使用现有的 R2 存储

**数据库变更**:
```sql
ALTER TABLE inventory_items
  ADD COLUMN photo_urls TEXT[];
```

---

### 18. 二维码/条码生成 🏷️

**需求**:
- 为每个 `inventory_item` 生成唯一二维码
- 扫码跳转到该商品详情页

**实现**:
- 使用 `qrcode` 库生成二维码
- URL: `https://yourdomain.com/freight/inbound/items/{itemId}`

---

### 19. 入库单复制功能 📋

**需求**:
- 快速复制已有入库单 (保留商品清单,但数量重置)
- 用于重复入库相同货物的场景

---

### 20. 入库单备注附件 📎

**需求**:
- 为入库单上传附件 (照片、扫描件、签收单等)
- 复用 `attachments` 表 (新增 `receipt_id` 字段)

**数据库变更**:
```sql
ALTER TABLE attachments
  ADD COLUMN receipt_id UUID REFERENCES warehouse_receipts(id);
```

---

### 21. 库存调整功能 🔧

**需求**:
- 手动调整 `current_qty` (盘点、损耗、退货等)
- 记录调整原因 → `inventory_movements` (ref_type='ADJUST')

**API 端点**:
```typescript
POST /api/freight/inventory-items/:id/adjust
Body: {
  qtyDelta: -5,        // 负数为减少,正数为增加
  reason: "盘点损耗",
  remarks: "破损3件,丢失2件"
}
```

---

### 22. 入库单模板功能 📝

**需求**:
- 保存常用的"仓库+客户+商品清单"为模板
- 下次入库时快速套用

---

### 23. 移动端优化 📱

**需求**:
- 响应式布局优化 (当前主要为桌面端)
- 扫码入库功能 (调用摄像头)

---

### 24. 库存合并/拆分 🔀

**需求**:
- 合并: 将同一入库单下相同商品的多行合并
- 拆分: 将一行库存拆分成多行 (不同库位)

---

### 25. 历史记录与审计 📜

**需求**:
- 记录所有修改操作 (谁在何时修改了什么)
- 新增 `audit_logs` 表

---

### 26. 国际化支持 🌐

**需求**:
- 所有前端文案迁移到 `messages/en.json` 和 `messages/zh.json`
- 当前部分硬编码中文

---

### 27. 数据导出与报表 📊

**需求**:
- 按时间范围导出入库单列表
- 统计报表: 按仓库/客户/时间维度汇总入库量

---

## 修复顺序建议

### 第一阶段 (立即修复 - 1-2天) ✅ 全部完成！
1. ✅ **已完成** 添加入库单详情页操作菜单 (编辑/删除/修改状态)
2. ✅ **已完成** 添加商品明细操作列 (编辑/删除/查看流水)
3. ✅ **已完成** 显示剩余库存 (current_qty/已出库/颜色预警)
4. ✅ **已完成** 添加状态筛选下拉框
5. ✅ **已完成** 状态 Badge 颜色区分 (蓝/黄/绿)

### 第二阶段 (重要功能 - 3-5天)
6. ✅ 添加入库单统计信息
7. ✅ 查看库存占用情况
8. ✅ 手动修改状态功能
9. ✅ 显示入库时间
10. ✅ 优化搜索功能
11. ✅ 编辑入库单时可修改入库时间

### 第三阶段 (增强体验 - 按需实现)
12-27. 根据业务需要逐步实现

---

## 技术债务说明

### 1. 类型定义不完整
- `FreightWarehouseReceiptWithRelations` 的 `stats` 字段类型未定义
- 建议在 `src/lib/freight/api-types.ts` 补充:
  ```typescript
  export interface ReceiptStats {
    totalItems: number;
    totalQty: number;
    remainingQty: number;
    totalWeight: number;
    allocatedQty: number;
  }
  ```

### 2. 状态流转逻辑未实现
- `updateReceiptStatus` 函数存在但逻辑可能不完整
- 需确认是否按 RELATIONS.md 文档实现

### 3. 权限控制缺失
- 当前所有用户都能修改/删除入库单
- 建议添加角色检查 (仅仓库管理员可操作)

---

## 测试清单

修复完成后需测试:
- [ ] 创建入库单 → 添加商品 → 编辑 → 删除
- [ ] 状态筛选功能
- [ ] 库存扣减后 `current_qty` 正确显示
- [ ] 已分配的入库单不能删除 (后端检查)
- [ ] 商品流水记录完整
- [ ] 状态自动计算逻辑 (出库后自动变为 PARTIAL/SHIPPED)

---

## 相关文件清单

### 前端组件
- `src/components/freight/inbound/freight-inbound-page-client.tsx` - 主组件
- `src/components/freight/inbound/edit-receipt-dialog.tsx` - 编辑对话框
- `src/components/freight/inbound/edit-item-dialog.tsx` - 编辑商品对话框
- `src/components/freight/inbound/delete-confirm-dialog.tsx` - 删除确认
- `src/components/freight/inbound/inventory-movements-dialog.tsx` - 流水记录

### 后端 API
- `src/app/api/freight/warehouse-receipts/route.ts` - GET/POST
- `src/app/api/freight/warehouse-receipts/[id]/route.ts` - GET/PATCH/DELETE
- `src/app/api/freight/warehouse-receipts/[id]/items/route.ts` - POST (添加商品)
- `src/app/api/freight/inventory-items/route.ts` - GET (查询商品)
- `src/app/api/freight/inventory-items/[id]/route.ts` - PATCH/DELETE
- `src/app/api/freight/inventory-items/[id]/movements/route.ts` - GET (流水)

### 业务逻辑
- `src/lib/freight/services/receipt-status.ts` - 状态计算
- `src/lib/freight/schemas.ts` - 数据校验
- `src/lib/freight/constants.ts` - 常量定义

### 数据库
- `src/db/schema.ts` - Drizzle 表定义
- `scripts/build_relations.sql` - 原始 SQL

---

## 下一步行动

1. **开发者**: 按优先级逐个修复 (建议从 P0 开始)
2. **产品**: 评审 P2 功能是否需要,调整优先级
3. **测试**: 准备测试用例,确保修复质量
4. **文档**: 更新用户手册,说明新功能使用方法

---

> **维护说明**: 本文档应随着功能开发进度持续更新,完成一项勾选一项 ✅

