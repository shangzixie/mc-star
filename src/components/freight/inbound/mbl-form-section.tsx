'use client';

import { PortCombobox } from '@/components/freight/shared/port-combobox';
import { FreightSection } from '@/components/freight/ui/freight-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCreateFreightMBL,
  useFreightMBL,
  useUpdateFreightMBL,
} from '@/hooks/freight/use-freight-mbl';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const mblFormSchema = z.object({
  portOfDestinationId: z.string().uuid().optional(),
  portOfDischargeId: z.string().uuid().optional(),
  portOfLoadingId: z.string().uuid().optional(),
  placeOfReceiptId: z.string().uuid().optional(),
});

type MBLFormData = z.infer<typeof mblFormSchema>;

export function MBLFormSection({ receiptId }: { receiptId: string }) {
  const t = useTranslations('Dashboard.freight.inbound.mbl');
  const tCommon = useTranslations('Common');

  const mblQuery = useFreightMBL(receiptId);
  const createMutation = useCreateFreightMBL(receiptId);
  const updateMutation = useUpdateFreightMBL(receiptId);

  const existingMBL = mblQuery.data;

  const form = useForm<MBLFormData>({
    resolver: zodResolver(mblFormSchema),
    defaultValues: {
      portOfDestinationId: undefined,
      portOfDischargeId: undefined,
      portOfLoadingId: undefined,
      placeOfReceiptId: undefined,
    },
  });

  // Update form when data loads
  useEffect(() => {
    if (existingMBL) {
      form.reset({
        portOfDestinationId: existingMBL.portOfDestinationId ?? undefined,
        portOfDischargeId: existingMBL.portOfDischargeId ?? undefined,
        portOfLoadingId: existingMBL.portOfLoadingId ?? undefined,
        placeOfReceiptId: existingMBL.placeOfReceiptId ?? undefined,
      });
    }
  }, [existingMBL, form]);

  const handleSave = async (data: MBLFormData) => {
    try {
      if (existingMBL) {
        // Update existing MBL
        await updateMutation.mutateAsync(data);
      } else {
        // Create new MBL
        await createMutation.mutateAsync(data);
      }
      toast.success(t('saved'));
      form.reset(data);
    } catch (error) {
      const message = getFreightApiErrorMessage(error);
      toast.error(message);
    }
  };

  const isDirty = form.formState.isDirty;
  const isLoading = mblQuery.isLoading;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <FreightSection title={t('title')}>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </FreightSection>
    );
  }

  return (
    <FreightSection
      title={t('title')}
      description={t('description')}
      actions={
        <Button
          type="button"
          onClick={form.handleSubmit(handleSave)}
          disabled={isSaving || !isDirty}
          size="sm"
          variant="default"
        >
          <Save className="mr-2 size-4" />
          {isSaving ? t('saving') : t('save')}
        </Button>
      }
    >
      <div className="space-y-4">
        {/* 目的港 */}
        <div className="space-y-2">
          <Label htmlFor="portOfDestinationId">{t('portOfDestination')}</Label>
          <Controller
            control={form.control}
            name="portOfDestinationId"
            render={({ field }) => (
              <PortCombobox
                value={field.value}
                onValueChange={field.onChange}
                placeholder={t('portOfDestinationPlaceholder')}
              />
            )}
          />
        </div>

        {/* 卸货港 */}
        <div className="space-y-2">
          <Label htmlFor="portOfDischargeId">{t('portOfDischarge')}</Label>
          <Controller
            control={form.control}
            name="portOfDischargeId"
            render={({ field }) => (
              <PortCombobox
                value={field.value}
                onValueChange={field.onChange}
                placeholder={t('portOfDischargePlaceholder')}
              />
            )}
          />
        </div>

        {/* 起运港 */}
        <div className="space-y-2">
          <Label htmlFor="portOfLoadingId">{t('portOfLoading')}</Label>
          <Controller
            control={form.control}
            name="portOfLoadingId"
            render={({ field }) => (
              <PortCombobox
                value={field.value}
                onValueChange={field.onChange}
                placeholder={t('portOfLoadingPlaceholder')}
              />
            )}
          />
        </div>

        {/* 收货地 */}
        <div className="space-y-2">
          <Label htmlFor="placeOfReceiptId">{t('placeOfReceipt')}</Label>
          <Controller
            control={form.control}
            name="placeOfReceiptId"
            render={({ field }) => (
              <PortCombobox
                value={field.value}
                onValueChange={field.onChange}
                placeholder={t('placeOfReceiptPlaceholder')}
              />
            )}
          />
        </div>
      </div>
    </FreightSection>
  );
}
