'use client';

import { AddCustomerDialog } from '@/components/freight/shared/add-customer-dialog';
import { BookingAgentCombobox } from '@/components/freight/shared/booking-agent-combobox';
import { CustomsAgentCombobox } from '@/components/freight/shared/customs-agent-combobox';
import { CustomerCombobox } from '@/components/freight/shared/customer-combobox';
import { ShipperCombobox } from '@/components/freight/shared/shipper-combobox';
import { FreightSection } from '@/components/freight/ui/freight-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateFreightWarehouseReceipt } from '@/hooks/freight/use-freight-warehouse-receipts';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import type { FreightWarehouseReceiptWithRelations } from '@/lib/freight/api-types';
import {
  RECEIPT_STATUSES,
  WAREHOUSE_RECEIPT_CUSTOMS_DECLARATION_TYPES,
  WAREHOUSE_RECEIPT_TRANSPORT_TYPES,
} from '@/lib/freight/constants';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { AlertCircle, ArrowLeft, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

// 表单Schema
const receiptFormSchema = z.object({
  customerId: z.string().optional(),
  status: z.string().min(1, '单核状态必填'),
  transportType: z.string().optional(),
  customsDeclarationType: z.string().optional(),
  inboundTime: z.string().min(1, '入库时间必填'),
  remarks: z.string().optional(),
  internalRemarks: z.string().optional(),
  // Contact information - parties (frontend only)
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

interface ReceiptFormEditViewProps {
  receipt: FreightWarehouseReceiptWithRelations;
  onBack: () => void;
  onSaveSuccess?: () => void;
}

export function ReceiptFormEditView({
  receipt,
  onBack,
  onSaveSuccess,
}: ReceiptFormEditViewProps) {
  const t = useTranslations('Dashboard.freight.inbound');
  const tCommon = useTranslations('Common');

  const [addCustomerDialogOpen, setAddCustomerDialogOpen] = useState(false);
  const updateMutation = useUpdateFreightWarehouseReceipt(receipt.id);

  const form = useForm<ReceiptFormData>({
    resolver: zodResolver(receiptFormSchema),
    defaultValues: {
      customerId: receipt.customerId ?? '',
      status: receipt.status ?? 'RECEIVED',
      transportType: receipt.transportType ?? '',
      customsDeclarationType: receipt.customsDeclarationType ?? '',
      inboundTime: formatDateTimeLocalValue(receipt.inboundTime),
      remarks: receipt.remarks ?? '',
      internalRemarks: receipt.internalRemarks ?? '',
      // Contact information - parties (frontend only for now)
      shipperId: '',
      bookingAgentId: '',
      customsAgentId: '',
    },
  });

  const isDirty = form.formState.isDirty;

  // 离开页面前提醒（可选）
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
      // 构建更新payload，只提交有变化的字段
      const payload: Record<string, any> = {};

      if (data.customerId !== (receipt.customerId ?? '')) {
        payload.customerId = data.customerId || undefined;
      }
      if (data.status !== receipt.status) {
        payload.status = data.status;
      }
      if (data.transportType !== (receipt.transportType ?? '')) {
        payload.transportType = data.transportType || undefined;
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

      if (Object.keys(payload).length === 0) {
        toast.info('没有需要保存的更改');
        return;
      }

      await updateMutation.mutateAsync(payload);
      toast.success(t('receiptActions.updateSuccess'));
      form.reset(data); // 重置dirty状态
      onSaveSuccess?.();
    } catch (error) {
      const message = getFreightApiErrorMessage(error);
      toast.error(message);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              if (isDirty) {
                if (confirm('有未保存的更改，确定要离开吗？')) {
                  onBack();
                }
              } else {
                onBack();
              }
            }}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-semibold">
              {t('receiptActions.edit')} - {receipt.receiptNo}
            </h2>
            {isDirty && (
              <div className="flex items-center gap-2 text-sm text-amber-600 mt-1">
                <AlertCircle className="size-3" />
                有未保存的更改
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (isDirty) {
                if (confirm('有未保存的更改，确定要取消吗？')) {
                  onBack();
                }
              } else {
                onBack();
              }
            }}
          >
            {tCommon('cancel')}
          </Button>

          <Button type="submit" disabled={updateMutation.isPending || !isDirty}>
            <Save className="mr-2 size-4" />
            {updateMutation.isPending ? tCommon('saving') : tCommon('save')}
          </Button>
        </div>
      </div>

      {/* Tab分区 */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">{t('detailTabs.basic')}</TabsTrigger>
          <TabsTrigger value="contact">{t('detailTabs.contact')}</TabsTrigger>
          <TabsTrigger value="remarks">{t('detailTabs.remarks')}</TabsTrigger>
        </TabsList>

        {/* Tab 1: 基本信息 */}
        <TabsContent value="basic" className="space-y-6">
          <FreightSection title={t('receipt.fields.receiptNo')}>
            <div className="space-y-4">
              {/* 入库单号（只读） */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  {t('receipt.fields.receiptNo')}
                </Label>
                <div className="text-lg font-semibold text-muted-foreground">
                  {receipt.receiptNo}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 单核状态 */}
                <div className="space-y-2">
                  <Label htmlFor="status" className="flex items-center gap-1">
                    {t('status.label')}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.watch('status')}
                    onValueChange={(value) =>
                      form.setValue('status', value, { shouldDirty: true })
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RECEIPT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {t(`status.${s.toLowerCase()}` as any)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.status && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.status.message}
                    </p>
                  )}
                </div>

                {/* 运输类型 */}
                <div className="space-y-2">
                  <Label htmlFor="transportType">
                    {t('transportType.label')}
                  </Label>
                  <Select
                    value={form.watch('transportType')}
                    onValueChange={(value) =>
                      form.setValue('transportType', value, {
                        shouldDirty: true,
                      })
                    }
                  >
                    <SelectTrigger id="transportType">
                      <SelectValue
                        placeholder={t('transportType.placeholder')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {WAREHOUSE_RECEIPT_TRANSPORT_TYPES.map((tt) => (
                        <SelectItem key={tt} value={tt}>
                          {t(`transportType.options.${tt}` as any)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Label
                    htmlFor="inboundTime"
                    className="flex items-center gap-1"
                  >
                    {t('inboundTime')}
                    <span className="text-destructive">*</span>
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
            </div>
          </FreightSection>
        </TabsContent>

        {/* Tab 2: 联系信息 */}
        <TabsContent value="contact" className="space-y-6">
          <FreightSection title={t('detailTabs.contact')}>
            <div className="space-y-4">
              {/* 客户 */}
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
        </TabsContent>

        {/* Tab 3: 备注 */}
        <TabsContent value="remarks" className="space-y-6">
          <FreightSection title="备注信息">
            <div className="space-y-4">
              {/* 内部备注 */}
              <div className="space-y-2">
                <Label htmlFor="internalRemarks">{t('internalRemarks')}</Label>
                <Textarea
                  id="internalRemarks"
                  {...form.register('internalRemarks')}
                  placeholder={t('receipt.fields.internalRemarksPlaceholder')}
                  rows={4}
                />
              </div>

              {/* 订舱备注 */}
              <div className="space-y-2">
                <Label htmlFor="remarks">{t('remarks')}</Label>
                <Textarea
                  id="remarks"
                  {...form.register('remarks')}
                  placeholder={t('receipt.fields.remarksPlaceholder')}
                  rows={4}
                />
              </div>
            </div>
          </FreightSection>
        </TabsContent>
      </Tabs>

      {/* 底部固定操作栏（可选，用于长表单） */}
      <div className="sticky bottom-0 bg-background border-t pt-4 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (isDirty) {
              if (confirm('有未保存的更改，确定要取消吗？')) {
                onBack();
              }
            } else {
              onBack();
            }
          }}
        >
          {tCommon('cancel')}
        </Button>

        <Button type="submit" disabled={updateMutation.isPending || !isDirty}>
          <Save className="mr-2 size-4" />
          {updateMutation.isPending ? tCommon('saving') : tCommon('save')}
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
