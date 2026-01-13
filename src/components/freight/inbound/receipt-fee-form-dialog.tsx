'use client';

import { PartyCombobox } from '@/components/freight/shared/party-combobox';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const feeFormSchema = z.object({
  feeType: z.enum(['AR', 'AP']),
  feeName: z.string().min(1, '费用名称必填'),
  unit: z.string().optional(),
  currency: z.string().optional(),
  price: z.string().optional(),
  quantity: z.string().optional(),
  originalAmount: z.string().optional(),
  settledCurrency: z.string().optional(),
  exchangeRate: z.string().optional(),
  settledAmount: z.string().optional(),
  paymentMethod: z.enum(['PPD', 'CCT']).optional(),
  partyId: z.string().optional(),
  remarks: z.string().optional(),
});

export type ReceiptFeeFormValues = z.infer<typeof feeFormSchema>;

function parseMaybeNumber(input: string | undefined) {
  const v = (input ?? '').trim();
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function formatFixed(input: number, digits: number) {
  if (!Number.isFinite(input)) return '';
  return input.toFixed(digits);
}

export function ReceiptFeeFormDialog({
  open,
  onOpenChange,
  title,
  submitText = '保存',
  defaultValues,
  isSubmitting,
  onSubmit,
  requestAddParty,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  submitText?: string;
  defaultValues: ReceiptFeeFormValues;
  isSubmitting?: boolean;
  onSubmit: (values: {
    feeType: 'AR' | 'AP';
    feeName: string;
    unit?: string;
    currency?: string;
    price?: number;
    quantity?: number;
    originalAmount?: number;
    settledCurrency?: string;
    exchangeRate?: number;
    settledAmount?: number;
    paymentMethod?: 'PPD' | 'CCT';
    partyId?: string;
    remarks?: string;
  }) => Promise<void>;
  requestAddParty: (onCreated: (partyId: string) => void) => void;
}) {
  const form = useForm<ReceiptFeeFormValues>({
    resolver: zodResolver(feeFormSchema),
    defaultValues,
  });

  const [originalManual, setOriginalManual] = useState(false);
  const [settledManual, setSettledManual] = useState(false);

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
      setOriginalManual(false);
      setSettledManual(false);
    }
  }, [open, defaultValues, form]);

  const price = form.watch('price');
  const quantity = form.watch('quantity');
  const exchangeRate = form.watch('exchangeRate');
  const originalAmount = form.watch('originalAmount');

  const priceN = useMemo(() => parseMaybeNumber(price), [price]);
  const quantityN = useMemo(() => parseMaybeNumber(quantity), [quantity]);
  const exchangeRateN = useMemo(
    () => parseMaybeNumber(exchangeRate),
    [exchangeRate]
  );
  const originalAmountN = useMemo(
    () => parseMaybeNumber(originalAmount),
    [originalAmount]
  );

  // Auto-calc 原币金额 = 价格 * 数量 (unless manually edited)
  useEffect(() => {
    if (!open) return;
    if (originalManual) return;
    if (priceN == null || quantityN == null) return;
    const next = priceN * quantityN;
    form.setValue('originalAmount', formatFixed(next, 2), {
      shouldDirty: true,
    });
  }, [open, originalManual, priceN, quantityN, form]);

  // Auto-calc 实收金额 = 原币金额 * 汇率 (unless manually edited)
  useEffect(() => {
    if (!open) return;
    if (settledManual) return;
    if (originalAmountN == null || exchangeRateN == null) return;
    const next = originalAmountN * exchangeRateN;
    form.setValue('settledAmount', formatFixed(next, 2), { shouldDirty: true });
  }, [open, settledManual, originalAmountN, exchangeRateN, form]);

  const handleSubmit = async (values: ReceiptFeeFormValues) => {
    await onSubmit({
      feeType: values.feeType,
      feeName: values.feeName,
      unit: values.unit?.trim() || undefined,
      currency: values.currency?.trim() || undefined,
      price: parseMaybeNumber(values.price),
      quantity: parseMaybeNumber(values.quantity),
      originalAmount: parseMaybeNumber(values.originalAmount),
      settledCurrency: values.settledCurrency?.trim() || undefined,
      exchangeRate: parseMaybeNumber(values.exchangeRate),
      settledAmount: parseMaybeNumber(values.settledAmount),
      paymentMethod: values.paymentMethod,
      partyId: values.partyId?.trim() || undefined,
      remarks: values.remarks?.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>费用名称 *</Label>
              <Input {...form.register('feeName')} />
              {form.formState.errors.feeName && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.feeName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>计量单位</Label>
              <Input {...form.register('unit')} />
            </div>

            <div className="space-y-2">
              <Label>币种</Label>
              <Input {...form.register('currency')} placeholder="如 USD" />
            </div>

            <div className="space-y-2">
              <Label>价格</Label>
              <Input inputMode="decimal" {...form.register('price')} />
            </div>

            <div className="space-y-2">
              <Label>数量</Label>
              <Input inputMode="decimal" {...form.register('quantity')} />
            </div>

            <div className="space-y-2">
              <Label>原币金额</Label>
              {(() => {
                const reg = form.register('originalAmount');
                return (
                  <Input
                    inputMode="decimal"
                    {...reg}
                    onChange={(e) => {
                      setOriginalManual(true);
                      reg.onChange(e);
                    }}
                  />
                );
              })()}
            </div>

            <div className="space-y-2">
              <Label>实收币种</Label>
              <Input
                {...form.register('settledCurrency')}
                placeholder="如 RMB"
              />
            </div>

            <div className="space-y-2">
              <Label>汇率</Label>
              <Input inputMode="decimal" {...form.register('exchangeRate')} />
            </div>

            <div className="space-y-2">
              <Label>实收金额</Label>
              {(() => {
                const reg = form.register('settledAmount');
                return (
                  <Input
                    inputMode="decimal"
                    {...reg}
                    onChange={(e) => {
                      setSettledManual(true);
                      reg.onChange(e);
                    }}
                  />
                );
              })()}
            </div>

            <div className="space-y-2">
              <Label>付款方式</Label>
              <Select
                value={form.watch('paymentMethod') ?? ''}
                onValueChange={(value) =>
                  form.setValue('paymentMethod', value as any, {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PPD">PPD</SelectItem>
                  <SelectItem value="CCT">CCT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>付款人/收款人</Label>
              <PartyCombobox
                value={form.watch('partyId')}
                onValueChange={(value) =>
                  form.setValue('partyId', value ?? '', { shouldDirty: true })
                }
                onAddNew={() =>
                  requestAddParty((partyId) => {
                    form.setValue('partyId', partyId, { shouldDirty: true });
                  })
                }
                placeholder="选择..."
                searchPlaceholder="搜索客户/公司..."
                emptyText="无结果"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>备注</Label>
            <Textarea rows={3} {...form.register('remarks')} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {submitText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
