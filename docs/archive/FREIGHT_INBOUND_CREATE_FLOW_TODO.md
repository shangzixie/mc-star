# Freight Inbound Create Flow - ToDo

目标：模仿参考系统的交互，把「创建入库单」拆成“先用最小必填创建单头，再逐步补齐信息并保存”，降低一次性填写压力，同时保证后续明细/库存流水有可挂载的单据容器。

约束（来自现有实现）：
- 后端创建 `warehouse_receipts` 时 **`receiptNo` 必填**（Zod schema + DB unique + not null）。
- 后端更新（PATCH）**不允许修改 `receiptNo`**（update schema `omit(receiptNo)`）。
- `transportType` 后端可选，但产品交互上希望尽量前置并强制用户选择。

---

## 阶段 A（最小必填创建单头）

**需求**
- 点击“创建入库单”只弹出一个简化弹窗：
  - 必填：`receiptNo`（入库单号）
  - 必选：`transportType`（运输类型）
- 点击“创建”后 POST 创建一条 `warehouse_receipts` 记录。
- 创建成功后自动进入该入库单详情页（现状已经支持）。

**实现点**
- 精简 `CreateReceiptDialog` 表单字段，仅保留 `receiptNo` 与 `transportType`。
- 前端校验 `transportType` 必选（即便后端可选）。

**验收标准**
- 运输类型未选时，无法提交并给出明确提示。
- 成功创建后，列表能看到新单；详情页能打开；显示的运输类型正确。

---

## 阶段 B（创建后引导完善信息）

**需求**
- 创建成功进入详情页后，自动弹出“编辑入库单（保存）”弹窗（复用现有 `EditReceiptDialog`）。
- 用户可继续补：仓库/客户/报关类型/入仓时间/备注/内部备注等，点击保存即可更新。
- 用户也可以直接关闭弹窗稍后再编辑，不影响继续录入明细。

**实现点**
- 在 `FreightInboundPageClient` 增加一个一次性的 `autoOpenEditAfterCreate` 标记：
  - 创建成功时置为 `true`。
  - 当详情数据加载完成（`selectedReceipt` 可用）时打开 `EditReceiptDialog`，并清除标记。

**验收标准**
- 创建后首次进入详情页会自动弹出编辑弹窗。
- 关闭弹窗后不再重复弹出（除非再次创建）。
- 保存成功后详情页的展示区块能反映更新后的字段。

---

## 阶段 C（可选：更像参考系统的“整页编辑 + 顶部保存”）

**需求（可选）**
- 详情页的“单头信息”改成可编辑表单（而不是只展示）。
- 顶部提供“保存/取消”，行为更贴近参考系统截图。

**实现点（可选）**
- 将 `ReceiptDetailView` 里的“单头展示卡片”替换为 `react-hook-form` 表单。
- 保存调用 `useUpdateFreightWarehouseReceipt`。

---

## 风险与对策

- **空单/误创建**：阶段 A 会增加“创建了但未补全”的单据。
  - 对策（轻量）：创建后自动弹出编辑（阶段 B）并引导补全。
  - 对策（正规，可选）：引入 `DRAFT` 状态或定时清理（需要后端/迁移）。
- **编号不可修改**：当前系统不支持后补/改 `receiptNo`。
  - 对策：把 `receiptNo` 固定为创建时必填；若未来要支持“先草稿后编号”，需后端改造（允许 null 或可更新，并处理唯一性）。

---

## 回滚方案

- 保留现有 `EditReceiptDialog` 不动；只要把 `CreateReceiptDialog` 恢复为“完整版表单”，并移除创建后自动打开编辑弹窗逻辑即可回到原交互。


