'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAddFreightInventoryItemToReceipt } from '@/hooks/freight/use-freight-warehouse-receipts';
import { PACKAGING_UNITS } from '@/lib/freight/constants';
import { addInventoryItemSchema } from '@/lib/freight/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const addItemFormSchema = z.object({
  commodityName: z.string().optional(),
  skuCode: z.string().optional(),
  initialQty: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => !Number.isNaN(v) && Number.isInteger(v) && v > 0, {
      message: 'Must be a positive integer',
    }),
  unit: z.string().optional(),
  weightPerUnit: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((v) => (v === '' || v == null ? undefined : Number(v)))
    .refine((v) => v === undefined || !Number.isNaN(v), {
      message: 'Invalid number',
    }),
  lengthCm: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((v) => (v === '' || v == null ? undefined : Number(v)))
    .refine((v) => v === undefined || !Number.isNaN(v), {
      message: 'Invalid number',
    }),
  widthCm: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((v) => (v === '' || v == null ? undefined : Number(v)))
    .refine((v) => v === undefined || !Number.isNaN(v), {
      message: 'Invalid number',
    }),
  heightCm: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((v) => (v === '' || v == null ? undefined : Number(v)))
    .refine((v) => v === undefined || !Number.isNaN(v), {
      message: 'Invalid number',
    }),
});

type AddItemFormInput = z.input<typeof addItemFormSchema>;
type AddItemFormOutput = z.output<typeof addItemFormSchema>;

export function AddItemDialog({
  open,
  onOpenChange,
  receiptId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptId: string;
}) {
  const t = useTranslations('Dashboard.freight.inbound');
  const addItemMutation = useAddFreightInventoryItemToReceipt(receiptId);

  const form = useForm<AddItemFormInput, any, AddItemFormOutput>({
    resolver: zodResolver(addItemFormSchema),
    defaultValues: {
      commodityName: '',
      skuCode: '',
      initialQty: 1,
      unit: '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const payload = addInventoryItemSchema.omit({ receiptId: true }).parse({
        ...values,
        commodityName: values.commodityName?.trim() || undefined,
        skuCode: values.skuCode?.trim() || undefined,
        unit: values.unit?.trim() || undefined,
      });

      await addItemMutation.mutateAsync(payload);
      toast.success(t('items.created'));
      form.reset({
        commodityName: '',
        skuCode: '',
        initialQty: 1,
        unit: '',
      });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('items.createFailed'));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('items.title')}</DialogTitle>
          <DialogDescription>{t('items.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="commodityName">
                {t('items.fields.commodityName')}
              </Label>
              <Input
                id="commodityName"
                autoComplete="off"
                placeholder={t('items.fields.commodityNamePlaceholder')}
                {...form.register('commodityName')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skuCode">{t('items.fields.skuCode')}</Label>
              <Input
                id="skuCode"
                autoComplete="off"
                placeholder={t('items.fields.skuCodePlaceholder')}
                {...form.register('skuCode')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="initialQty">
                {t('items.columns.initialQty')}
              </Label>
              <Input
                id="initialQty"
                type="number"
                step="1"
                {...form.register('initialQty')}
              />
              {form.formState.errors.initialQty?.message && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.initialQty.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">{t('items.fields.unit')}</Label>
              <select
                id="unit"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                {...form.register('unit')}
              >
                <option value="">{t('items.fields.unitPlaceholder')}</option>
                {PACKAGING_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weightPerUnit">
              {t('items.fields.weightPerUnit')}
            </Label>
            <Input
              id="weightPerUnit"
              type="number"
              step="0.001"
              placeholder="kg"
              {...form.register('weightPerUnit')}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lengthCm">{t('items.fields.lengthCm')}</Label>
              <Input
                id="lengthCm"
                type="number"
                step="0.001"
                placeholder="cm"
                {...form.register('lengthCm')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="widthCm">{t('items.fields.widthCm')}</Label>
              <Input
                id="widthCm"
                type="number"
                step="0.001"
                placeholder="cm"
                {...form.register('widthCm')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heightCm">{t('items.fields.heightCm')}</Label>
              <Input
                id="heightCm"
                type="number"
                step="0.001"
                placeholder="cm"
                {...form.register('heightCm')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('items.cancel')}
            </Button>
            <Button type="submit" disabled={addItemMutation.isPending}>
              {addItemMutation.isPending
                ? t('items.creating')
                : t('items.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
