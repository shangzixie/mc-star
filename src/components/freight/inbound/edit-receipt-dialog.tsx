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
import { Textarea } from '@/components/ui/textarea';
import { useFreightParties } from '@/hooks/freight/use-freight-master-data';
import { useFreightWarehouses } from '@/hooks/freight/use-freight-master-data';
import { useUpdateFreightWarehouseReceipt } from '@/hooks/freight/use-freight-warehouse-receipts';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import type { FreightWarehouseReceipt } from '@/lib/freight/api-types';
import {
  RECEIPT_STATUSES,
  WAREHOUSE_RECEIPT_TRANSPORT_TYPES,
} from '@/lib/freight/constants';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const editReceiptSchema = z.object({
  warehouseId: z.string().optional(),
  customerId: z.string().optional(),
  transportType: z.enum(WAREHOUSE_RECEIPT_TRANSPORT_TYPES).optional(),
  status: z.enum(RECEIPT_STATUSES).optional(),
  inboundTime: z.string().optional(),
  remarks: z.string().optional(),
});

type EditReceiptFormData = z.infer<typeof editReceiptSchema>;

interface EditReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: FreightWarehouseReceipt;
}

export function EditReceiptDialog({
  open,
  onOpenChange,
  receipt,
}: EditReceiptDialogProps) {
  const t = useTranslations();
  const updateMutation = useUpdateFreightWarehouseReceipt(receipt.id);
  const { data: warehouses } = useFreightWarehouses({ q: '' });
  const { data: allParties } = useFreightParties({ q: '' });
  const customers = allParties?.filter((p) => p.roles.includes('CUSTOMER'));

  const form = useForm<EditReceiptFormData>({
    resolver: zodResolver(editReceiptSchema),
    defaultValues: {
      warehouseId: receipt.warehouseId ?? undefined,
      customerId: receipt.customerId ?? undefined,
      transportType: receipt.transportType ?? undefined,
      status: receipt.status as 'RECEIVED' | 'SHIPPED' | 'PARTIAL',
      inboundTime: receipt.inboundTime
        ? format(new Date(receipt.inboundTime), "yyyy-MM-dd'T'HH:mm")
        : undefined,
      remarks: receipt.remarks ?? undefined,
    },
  });

  // Reset form when receipt changes
  useEffect(() => {
    form.reset({
      warehouseId: receipt.warehouseId ?? undefined,
      customerId: receipt.customerId ?? undefined,
      transportType: receipt.transportType ?? undefined,
      status: receipt.status as 'RECEIVED' | 'SHIPPED' | 'PARTIAL',
      inboundTime: receipt.inboundTime
        ? format(new Date(receipt.inboundTime), "yyyy-MM-dd'T'HH:mm")
        : undefined,
      remarks: receipt.remarks ?? undefined,
    });
  }, [receipt, form]);

  const onSubmit = async (data: EditReceiptFormData) => {
    try {
      await updateMutation.mutateAsync(data);
      toast.success(
        t('Dashboard.freight.inbound.receiptActions.updateSuccess')
      );
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
            {t('Dashboard.freight.inbound.receiptActions.editTitle')}
          </DialogTitle>
          <DialogDescription>{receipt.receiptNo}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="warehouseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('Dashboard.freight.inbound.warehouse')}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t(
                            'Dashboard.freight.inbound.selectWarehouse'
                          )}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {warehouses?.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
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
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('Dashboard.freight.inbound.customer')}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t(
                            'Dashboard.freight.inbound.selectCustomer'
                          )}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.nameCn || customer.nameEn || customer.code}
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('Dashboard.freight.inbound.status.label')}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RECEIPT_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {t(
                            `Dashboard.freight.inbound.status.${status.toLowerCase()}` as any
                          )}
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
              name="transportType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('Dashboard.freight.inbound.transportType.label')}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t(
                            'Dashboard.freight.inbound.transportType.placeholder'
                          )}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {WAREHOUSE_RECEIPT_TRANSPORT_TYPES.map((tt) => (
                        <SelectItem key={tt} value={tt}>
                          {t(
                            `Dashboard.freight.inbound.transportType.options.${tt}` as any
                          )}
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
              name="inboundTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('Dashboard.freight.inbound.inboundTime')}
                  </FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('Dashboard.freight.inbound.remarks')}
                  </FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
