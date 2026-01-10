'use client';

import { EmployeeAssignmentsSection } from '@/components/freight/inbound/employee-assignments-section';
import { MBLFormSection } from '@/components/freight/inbound/mbl-form-section';
import { AddCustomerDialog } from '@/components/freight/shared/add-customer-dialog';
import { BookingAgentCombobox } from '@/components/freight/shared/booking-agent-combobox';
import { CustomerCombobox } from '@/components/freight/shared/customer-combobox';
import { CustomsAgentCombobox } from '@/components/freight/shared/customs-agent-combobox';
import { ShipperCombobox } from '@/components/freight/shared/shipper-combobox';
import { FreightSection } from '@/components/freight/ui/freight-section';
import { FreightTableSection } from '@/components/freight/ui/freight-table-section';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateFreightHBL,
  useFreightHBL,
  useUpdateFreightHBL,
} from '@/hooks/freight/use-freight-hbl';
import { useFreightInventoryItems } from '@/hooks/freight/use-freight-inventory-items';
import {
  useCreateFreightMBL,
  useFreightMBL,
  useUpdateFreightMBL,
} from '@/hooks/freight/use-freight-mbl';
import { useUpdateFreightWarehouseReceipt } from '@/hooks/freight/use-freight-warehouse-receipts';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import type {
  FreightInventoryItem,
  FreightWarehouseReceiptWithRelations,
} from '@/lib/freight/api-types';
import {
  WAREHOUSE_RECEIPT_CUSTOMS_DECLARATION_TYPES,
} from '@/lib/freight/constants';
import { formatCeilFixed } from '@/lib/freight/math';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import {
  AlertCircle,
  ArrowLeft,
  Edit,
  MoreHorizontal,
  Package,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const receiptFormSchema = z.object({
  customerId: z.string().optional(),
  customsDeclarationType: z.string().optional(),
  inboundTime: z.string().min(1, '入库时间必填'),
  mblNo: z.string().max(50).optional(),
  soNo: z.string().max(50).optional(),
  hblNo: z.string().max(50).optional(),
  remarks: z.string().optional(),
  internalRemarks: z.string().optional(),
  // Employee assignments
  salesEmployeeId: z.string().optional(),
  customerServiceEmployeeId: z.string().optional(),
  overseasCsEmployeeId: z.string().optional(),
  operationsEmployeeId: z.string().optional(),
  documentationEmployeeId: z.string().optional(),
  financeEmployeeId: z.string().optional(),
  bookingEmployeeId: z.string().optional(),
  reviewerEmployeeId: z.string().optional(),
  // Contact information - parties
  shipperId: z.string().optional(),
  bookingAgentId: z.string().optional(),
  customsAgentId: z.string().optional(),
});

type ReceiptFormData = z.infer<typeof receiptFormSchema>;

function formatDateTimeLocalValue(value: string | null | undefined) {
  if (!value) return '';
  try {
    return format(new Date(value), "yyyy-MM-dd'T'HH:mm");
  } catch {
    return '';
  }
}

export function ReceiptDetailEditView({
  receipt,
  onBack,
  onAddItem,
  onDelete,
  onEditItem,
  onDeleteItem,
}: {
  receipt: FreightWarehouseReceiptWithRelations;
  onBack: () => void;
  onAddItem: () => void;
  onDelete: () => void;
  onEditItem: (item: FreightInventoryItem) => void;
  onDeleteItem: (item: FreightInventoryItem) => void;
}) {
  const t = useTranslations('Dashboard.freight.inbound');
  const tCommon = useTranslations('Common');
  const tCustomerFields = useTranslations(
    'Dashboard.freight.settings.customers.fields'
  );
  const tCustomerColumns = useTranslations(
    'Dashboard.freight.settings.customers.columns'
  );

  const [addCustomerDialogOpen, setAddCustomerDialogOpen] = useState(false);
  const updateMutation = useUpdateFreightWarehouseReceipt(receipt.id);

  const mblQuery = useFreightMBL(receipt.id);
  const createMblMutation = useCreateFreightMBL(receipt.id);
  const updateMblMutation = useUpdateFreightMBL(receipt.id);

  const hblQuery = useFreightHBL(receipt.id);
  const createHblMutation = useCreateFreightHBL(receipt.id);
  const updateHblMutation = useUpdateFreightHBL(receipt.id);

  const itemsQuery = useFreightInventoryItems({
    receiptId: receipt.id,
    q: '',
  });

  const items = itemsQuery.data ?? [];
  const renderedItems = useMemo(() => items, [items]);

  const form = useForm<ReceiptFormData>({
    resolver: zodResolver(receiptFormSchema),
    defaultValues: {
      customerId: receipt.customerId ?? '',
      customsDeclarationType: receipt.customsDeclarationType ?? '',
      inboundTime: formatDateTimeLocalValue(receipt.inboundTime),
      mblNo: '',
      soNo: '',
      hblNo: '',
      remarks: receipt.remarks ?? '',
      internalRemarks: receipt.internalRemarks ?? '',
      // Employee assignments - will be populated when backend is ready
      salesEmployeeId: '',
      customerServiceEmployeeId: '',
      overseasCsEmployeeId: '',
      operationsEmployeeId: '',
      documentationEmployeeId: '',
      financeEmployeeId: '',
      bookingEmployeeId: '',
      reviewerEmployeeId: '',
      // Contact information - parties (frontend only for now)
      shipperId: '',
      bookingAgentId: '',
      customsAgentId: '',
    },
  });

  const isDirty = form.formState.isDirty;
  const isSaving =
    updateMutation.isPending ||
    createMblMutation.isPending ||
    updateMblMutation.isPending ||
    createHblMutation.isPending ||
    updateHblMutation.isPending;

  useEffect(() => {
    const nextMblNo = mblQuery.data?.mblNo ?? '';
    const current = form.getValues('mblNo') ?? '';
    if (nextMblNo !== current) {
      form.setValue('mblNo', nextMblNo, { shouldDirty: false });
    }
  }, [mblQuery.data?.mblNo, form]);

  useEffect(() => {
    const nextSoNo = mblQuery.data?.soNo ?? '';
    const current = form.getValues('soNo') ?? '';
    if (nextSoNo !== current) {
      form.setValue('soNo', nextSoNo, { shouldDirty: false });
    }
  }, [mblQuery.data?.soNo, form]);

  useEffect(() => {
    const nextHblNo = hblQuery.data?.hblNo ?? '';
    const current = form.getValues('hblNo') ?? '';
    if (nextHblNo !== current) {
      form.setValue('hblNo', nextHblNo, { shouldDirty: false });
    }
  }, [hblQuery.data?.hblNo, form]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleSave = async (data: ReceiptFormData) => {
    try {
      const payload: Record<string, any> = {};

      if (data.customerId !== (receipt.customerId ?? '')) {
        payload.customerId = data.customerId || undefined;
      }
      if (
        data.customsDeclarationType !== (receipt.customsDeclarationType ?? '')
      ) {
        payload.customsDeclarationType =
          data.customsDeclarationType || undefined;
      }
      if (data.inboundTime !== formatDateTimeLocalValue(receipt.inboundTime)) {
        payload.inboundTime = data.inboundTime;
      }
      if (data.remarks !== (receipt.remarks ?? '')) {
        payload.remarks = data.remarks;
      }
      if (data.internalRemarks !== (receipt.internalRemarks ?? '')) {
        payload.internalRemarks = data.internalRemarks;
      }

      const nextMblNo = (data.mblNo ?? '').trim();
      const prevMblNo = (mblQuery.data?.mblNo ?? '').trim();
      const hasMblNoChange = nextMblNo !== prevMblNo;

      const nextSoNo = (data.soNo ?? '').trim();
      const prevSoNo = (mblQuery.data?.soNo ?? '').trim();
      const hasSoNoChange = nextSoNo !== prevSoNo;

      const nextHblNo = (data.hblNo ?? '').trim();
      const prevHblNo = (hblQuery.data?.hblNo ?? '').trim();
      const hasHblNoChange = nextHblNo !== prevHblNo;

      // Employee assignments - Note: Backend fields not yet implemented
      // These will be sent to API but won't be persisted until backend is ready
      if (data.salesEmployeeId) {
        payload.salesEmployeeId = data.salesEmployeeId;
      }
      if (data.customerServiceEmployeeId) {
        payload.customerServiceEmployeeId = data.customerServiceEmployeeId;
      }
      if (data.overseasCsEmployeeId) {
        payload.overseasCsEmployeeId = data.overseasCsEmployeeId;
      }
      if (data.operationsEmployeeId) {
        payload.operationsEmployeeId = data.operationsEmployeeId;
      }
      if (data.documentationEmployeeId) {
        payload.documentationEmployeeId = data.documentationEmployeeId;
      }
      if (data.financeEmployeeId) {
        payload.financeEmployeeId = data.financeEmployeeId;
      }
      if (data.bookingEmployeeId) {
        payload.bookingEmployeeId = data.bookingEmployeeId;
      }
      if (data.reviewerEmployeeId) {
        payload.reviewerEmployeeId = data.reviewerEmployeeId;
      }

      // Contact information - parties (frontend only, backend not yet implemented)
      if (data.shipperId) {
        payload.shipperId = data.shipperId;
      }
      if (data.bookingAgentId) {
        payload.bookingAgentId = data.bookingAgentId;
      }
      if (data.customsAgentId) {
        payload.customsAgentId = data.customsAgentId;
      }

      if (
        Object.keys(payload).length === 0 &&
        !hasMblNoChange &&
        !hasSoNoChange &&
        !hasHblNoChange
      ) {
        toast.info('没有需要保存的更改');
        return;
      }

      if (Object.keys(payload).length > 0) {
        await updateMutation.mutateAsync(payload);
      }

      if (hasMblNoChange) {
        const mblNo = nextMblNo || null;
        if (mblQuery.data) {
          await updateMblMutation.mutateAsync({ mblNo });
        } else if (mblNo) {
          await createMblMutation.mutateAsync({ mblNo });
        }
      }

      if (hasSoNoChange) {
        const soNo = nextSoNo || null;
        if (mblQuery.data) {
          await updateMblMutation.mutateAsync({ soNo });
        } else if (soNo) {
          await createMblMutation.mutateAsync({ soNo });
        }
      }

      if (hasHblNoChange) {
        const hblNo = nextHblNo || null;
        if (hblQuery.data) {
          await updateHblMutation.mutateAsync({ hblNo });
        } else if (hblNo) {
          await createHblMutation.mutateAsync({ hblNo });
        }
      }

      toast.success(t('receiptActions.updateSuccess'));
      form.reset({
        ...data,
        mblNo: nextMblNo,
        soNo: nextSoNo,
        hblNo: nextHblNo,
      });
    } catch (error) {
      const message = getFreightApiErrorMessage(error);
      toast.error(message);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
      {/* 顶部操作栏 */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          {isDirty && (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <AlertCircle className="size-3" />
              有未保存的更改
            </div>
          )}
        </div>

        <Button type="submit" disabled={isSaving || !isDirty} size="sm">
          <Save className="mr-2 size-4" />
          {isSaving ? tCommon('saving') : tCommon('save')}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="mr-2 size-4" />
              {t('receiptActions.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 主要内容区域 */}
      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        {/* 左侧：基本信息表单 */}
        <FreightSection title={t('receipt.fields.receiptNo')}>
          <div className="space-y-4">
            {/* 入库单号（只读） */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                {t('receipt.fields.receiptNo')}
              </Label>
              <div className="text-lg font-semibold">
                {receipt.receiptNo}
                {mblQuery.data?.soNo ? (
                  <span className="ml-2 text-base font-medium text-muted-foreground">
                    / SO {mblQuery.data.soNo}
                  </span>
                ) : null}
              </div>
            </div>

            {/* SO No */}
            <div className="space-y-2">
              <Label htmlFor="soNo">SO号</Label>
              <Input
                id="soNo"
                placeholder="请输入SO号"
                {...form.register('soNo')}
              />
            </div>

            {/* MBL No */}
            <div className="space-y-2">
              <Label htmlFor="mblNo">{t('receipt.fields.mblNo')}</Label>
              <Input
                id="mblNo"
                placeholder={t('receipt.fields.mblNoPlaceholder')}
                {...form.register('mblNo')}
              />
            </div>

            {/* HBL No */}
            <div className="space-y-2">
              <Label htmlFor="hblNo">{t('receipt.fields.hblNo')}</Label>
              <Input
                id="hblNo"
                placeholder={t('receipt.fields.hblNoPlaceholder')}
                {...form.register('hblNo')}
              />
            </div>

            {/* 运输类型（创建时已确定，仅展示） */}
            <div className="space-y-2">
              <Label className="text-sm">{t('transportType.label')}</Label>
              <div className="text-sm text-muted-foreground">
                {receipt.transportType
                  ? t(`transportType.options.${receipt.transportType}` as any)
                  : '-'}
              </div>
            </div>

            {/* 报关类型 */}
            <div className="space-y-2">
              <Label htmlFor="customsDeclarationType">
                {t('customsDeclarationType.label')}
              </Label>
              <Select
                value={form.watch('customsDeclarationType')}
                onValueChange={(value) =>
                  form.setValue('customsDeclarationType', value, {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger id="customsDeclarationType">
                  <SelectValue
                    placeholder={t('customsDeclarationType.placeholder')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {WAREHOUSE_RECEIPT_CUSTOMS_DECLARATION_TYPES.map((ct) => (
                    <SelectItem key={ct} value={ct}>
                      {t(`customsDeclarationType.options.${ct}` as any)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 入库时间 */}
            <div className="space-y-2">
              <Label htmlFor="inboundTime">
                {t('inboundTime')}
                <span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id="inboundTime"
                type="datetime-local"
                {...form.register('inboundTime')}
              />
              {form.formState.errors.inboundTime && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.inboundTime.message}
                </p>
              )}
            </div>
          </div>
        </FreightSection>

        {/* 右侧：商品明细表格 */}
        <FreightTableSection
          title={t('itemsList.title')}
          icon={Package}
          actions={
            <Button onClick={onAddItem} size="sm" type="button">
              <Plus className="mr-2 size-4" />
              {t('items.create')}
            </Button>
          }
        >
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>{t('items.columns.commodity')}</TableHead>
                <TableHead>{t('items.columns.sku')}</TableHead>
                <TableHead className="text-right">
                  {t('items.columns.initialQty')}
                </TableHead>
                <TableHead>{t('items.columns.unit')}</TableHead>
                <TableHead>{t('items.columns.location')}</TableHead>
                <TableHead className="text-right">
                  {t('items.fields.weightPerUnit')}
                </TableHead>
                <TableHead className="text-right">
                  {t('items.columns.totalWeight')}
                </TableHead>
                <TableHead className="text-right">
                  {t('items.columns.totalVolume')}
                </TableHead>
                <TableHead className="w-[72px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemsQuery.isLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <TableRow key={`sk-${idx}`} className="h-14">
                    {Array.from({ length: 9 }).map((__, cIdx) => (
                      <TableCell key={`sk-${idx}-${cIdx}`}>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : itemsQuery.error ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <Empty>
                      <EmptyHeader>
                        <EmptyTitle>{t('items.error')}</EmptyTitle>
                        <EmptyDescription>
                          {getFreightApiErrorMessage(itemsQuery.error)}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : renderedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <Empty>
                      <EmptyHeader>
                        <EmptyTitle>{t('items.empty')}</EmptyTitle>
                        <EmptyDescription>
                          {t('items.emptyHint')}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                renderedItems.map((item) => {
                  const weightPerUnit =
                    item.weightPerUnit != null
                      ? Number(item.weightPerUnit)
                      : undefined;
                  const totalWeightKg =
                    weightPerUnit != null && Number.isFinite(weightPerUnit)
                      ? weightPerUnit * item.initialQty
                      : undefined;

                  const lengthCm =
                    item.lengthCm != null ? Number(item.lengthCm) : undefined;
                  const widthCm =
                    item.widthCm != null ? Number(item.widthCm) : undefined;
                  const heightCm =
                    item.heightCm != null ? Number(item.heightCm) : undefined;
                  const totalVolumeM3 =
                    lengthCm != null &&
                    widthCm != null &&
                    heightCm != null &&
                    Number.isFinite(lengthCm) &&
                    Number.isFinite(widthCm) &&
                    Number.isFinite(heightCm)
                      ? (lengthCm * widthCm * heightCm * item.initialQty) /
                        1_000_000
                      : undefined;

                  return (
                    <TableRow key={item.id} className="h-14">
                      <TableCell className="font-medium">
                        {item.commodityName ?? '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.skuCode ?? '-'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {item.initialQty}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.unit ?? '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.binLocation ?? '-'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {weightPerUnit != null
                          ? formatCeilFixed(weightPerUnit, 3)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {totalWeightKg != null
                          ? formatCeilFixed(totalWeightKg, 2)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {totalVolumeM3 != null
                          ? formatCeilFixed(totalVolumeM3, 3)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              type="button"
                            >
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEditItem(item)}>
                              <Edit className="mr-2 size-4" />
                              {t('itemActions.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDeleteItem(item)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 size-4" />
                              {t('itemActions.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </FreightTableSection>
      </div>

      {/* 备注区域 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="internalRemarks">{t('internalRemarks')}</Label>
          <Textarea
            id="internalRemarks"
            {...form.register('internalRemarks')}
            placeholder={t('receipt.fields.internalRemarksPlaceholder')}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="remarks">{t('remarks')}</Label>
          <Textarea
            id="remarks"
            {...form.register('remarks')}
            placeholder={t('receipt.fields.remarksPlaceholder')}
            rows={3}
          />
        </div>
      </div>

      {/* Tab区域：基本信息 */}
      <Tabs defaultValue="basic" className="space-y-3">
        <TabsList>
          <TabsTrigger value="basic">{t('detailTabs.basic')}</TabsTrigger>
        </TabsList>
        <TabsContent value="basic">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* 左侧：雇员分配 */}
            <EmployeeAssignmentsSection
              salesEmployeeId={form.watch('salesEmployeeId')}
              customerServiceEmployeeId={form.watch(
                'customerServiceEmployeeId'
              )}
              overseasCsEmployeeId={form.watch('overseasCsEmployeeId')}
              operationsEmployeeId={form.watch('operationsEmployeeId')}
              documentationEmployeeId={form.watch('documentationEmployeeId')}
              financeEmployeeId={form.watch('financeEmployeeId')}
              bookingEmployeeId={form.watch('bookingEmployeeId')}
              reviewerEmployeeId={form.watch('reviewerEmployeeId')}
              onSalesEmployeeChange={(value) =>
                form.setValue('salesEmployeeId', value ?? '', {
                  shouldDirty: true,
                })
              }
              onCustomerServiceEmployeeChange={(value) =>
                form.setValue('customerServiceEmployeeId', value ?? '', {
                  shouldDirty: true,
                })
              }
              onOverseasCsEmployeeChange={(value) =>
                form.setValue('overseasCsEmployeeId', value ?? '', {
                  shouldDirty: true,
                })
              }
              onOperationsEmployeeChange={(value) =>
                form.setValue('operationsEmployeeId', value ?? '', {
                  shouldDirty: true,
                })
              }
              onDocumentationEmployeeChange={(value) =>
                form.setValue('documentationEmployeeId', value ?? '', {
                  shouldDirty: true,
                })
              }
              onFinanceEmployeeChange={(value) =>
                form.setValue('financeEmployeeId', value ?? '', {
                  shouldDirty: true,
                })
              }
              onBookingEmployeeChange={(value) =>
                form.setValue('bookingEmployeeId', value ?? '', {
                  shouldDirty: true,
                })
              }
              onReviewerEmployeeChange={(value) =>
                form.setValue('reviewerEmployeeId', value ?? '', {
                  shouldDirty: true,
                })
              }
            />

            {/* 中间：联系资料 */}
            <FreightSection title={t('detailSections.contact')}>
              <div className="grid gap-4">
                {/* 客户选择 */}
                <div className="space-y-2">
                  <Label htmlFor="customerId">{t('customer')}</Label>
                  <CustomerCombobox
                    value={form.watch('customerId')}
                    onValueChange={(value) =>
                      form.setValue('customerId', value, { shouldDirty: true })
                    }
                    onAddNew={() => setAddCustomerDialogOpen(true)}
                    placeholder={t('selectCustomer')}
                  />
                </div>

                {/* 发货人 */}
                <div className="space-y-2">
                  <Label htmlFor="shipperId">{t('shipper')}</Label>
                  <ShipperCombobox
                    value={form.watch('shipperId')}
                    onValueChange={(value) =>
                      form.setValue('shipperId', value, { shouldDirty: true })
                    }
                    placeholder={t('selectShipper')}
                  />
                </div>

                {/* 订舱代理 */}
                <div className="space-y-2">
                  <Label htmlFor="bookingAgentId">{t('bookingAgent')}</Label>
                  <BookingAgentCombobox
                    value={form.watch('bookingAgentId')}
                    onValueChange={(value) =>
                      form.setValue('bookingAgentId', value, {
                        shouldDirty: true,
                      })
                    }
                    placeholder={t('selectBookingAgent')}
                  />
                </div>

                {/* 清关代理 */}
                <div className="space-y-2">
                  <Label htmlFor="customsAgentId">{t('customsAgent')}</Label>
                  <CustomsAgentCombobox
                    value={form.watch('customsAgentId')}
                    onValueChange={(value) =>
                      form.setValue('customsAgentId', value, {
                        shouldDirty: true,
                      })
                    }
                    placeholder={t('selectCustomsAgent')}
                  />
                </div>
              </div>
            </FreightSection>

            {/* 右侧：提单信息 */}
            <MBLFormSection receiptId={receipt.id} />
          </div>
        </TabsContent>
      </Tabs>

      {/* 底部固定保存按钮 */}
      <div className="sticky bottom-0 bg-background border-t pt-4 flex justify-end">
        <Button type="submit" disabled={isSaving || !isDirty} size="lg">
          <Save className="mr-2 size-4" />
          {isSaving ? tCommon('saving') : tCommon('save')}
        </Button>
      </div>

      {/* Add Customer Dialog */}
      <AddCustomerDialog
        open={addCustomerDialogOpen}
        onOpenChange={setAddCustomerDialogOpen}
        onSuccess={(customerId) => {
          form.setValue('customerId', customerId, { shouldDirty: true });
        }}
      />
    </form>
  );
}
