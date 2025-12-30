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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateFreightInventoryItem } from '@/hooks/freight/use-freight-inventory-items';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import type { FreightInventoryItem } from '@/lib/freight/api-types';
import { PACKAGING_UNITS } from '@/lib/freight/constants';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const editItemSchema = z.object({
  commodityName: z.string().optional(),
  skuCode: z.string().max(50).optional(),
  unit: z.string().max(10).optional(),
  binLocation: z.string().max(50).optional(),
  weightTotal: z.number().optional(),
  lengthCm: z.number().optional(),
  widthCm: z.number().optional(),
  heightCm: z.number().optional(),
});

type EditItemFormData = z.infer<typeof editItemSchema>;

interface EditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FreightInventoryItem;
}

export function EditItemDialog({
  open,
  onOpenChange,
  item,
}: EditItemDialogProps) {
  const t = useTranslations();
  const updateMutation = useUpdateFreightInventoryItem(item.id);

  const form = useForm<EditItemFormData>({
    resolver: zodResolver(editItemSchema),
    defaultValues: {
      commodityName: item.commodityName ?? undefined,
      skuCode: item.skuCode ?? undefined,
      unit: item.unit ?? undefined,
      binLocation: item.binLocation ?? undefined,
      weightTotal: item.weightTotal ? Number(item.weightTotal) : undefined,
      lengthCm: item.lengthCm ? Number(item.lengthCm) : undefined,
      widthCm: item.widthCm ? Number(item.widthCm) : undefined,
      heightCm: item.heightCm ? Number(item.heightCm) : undefined,
    },
  });

  // Reset form when item changes
  useEffect(() => {
    form.reset({
      commodityName: item.commodityName ?? undefined,
      skuCode: item.skuCode ?? undefined,
      unit: item.unit ?? undefined,
      binLocation: item.binLocation ?? undefined,
      weightTotal: item.weightTotal ? Number(item.weightTotal) : undefined,
      lengthCm: item.lengthCm ? Number(item.lengthCm) : undefined,
      widthCm: item.widthCm ? Number(item.widthCm) : undefined,
      heightCm: item.heightCm ? Number(item.heightCm) : undefined,
    });
  }, [item, form]);

  const onSubmit = async (data: EditItemFormData) => {
    try {
      await updateMutation.mutateAsync(data);
      toast.success(t('Dashboard.freight.inbound.itemActions.updateSuccess'));
      onOpenChange(false);
    } catch (error) {
      toast.error(getFreightApiErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {t('Dashboard.freight.inbound.itemActions.editTitle')}
          </DialogTitle>
          <DialogDescription>
            {item.commodityName ||
              item.skuCode ||
              t('Dashboard.freight.inbound.itemActions.unnamed')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="commodityName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('Dashboard.freight.inbound.itemActions.commodityName')}
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="skuCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('Dashboard.freight.inbound.itemActions.skuCode')}
                  </FormLabel>
                  <FormControl>
                    <Input {...field} maxLength={50} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('Dashboard.freight.inbound.itemActions.unit')}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              'Dashboard.freight.inbound.items.fields.unitPlaceholder'
                            )}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PACKAGING_UNITS.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="binLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('Dashboard.freight.inbound.itemActions.binLocation')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        maxLength={50}
                        placeholder="e.g., A-01-02"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="weightTotal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('Dashboard.freight.inbound.itemActions.weightTotal')}{' '}
                    (kg)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="lengthCm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('Dashboard.freight.inbound.itemActions.length')} (cm)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="widthCm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('Dashboard.freight.inbound.itemActions.width')} (cm)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="heightCm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('Dashboard.freight.inbound.itemActions.height')} (cm)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              {t('Dashboard.freight.inbound.itemActions.editNote')}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateMutation.isPending}
              >
                {t('Common.cancel')}
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending
                  ? t('Common.saving')
                  : t('Common.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
