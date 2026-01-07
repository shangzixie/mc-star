'use client';

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
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const mblFormSchema = z.object({
  portOfDestination: z.string().optional(),
  countryOfDestination: z.string().max(100).optional(),
  portOfDischarge: z.string().optional(),
  portOfLoading: z.string().optional(),
  placeOfReceipt: z.string().optional(),
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
      portOfDestination: '',
      countryOfDestination: '',
      portOfDischarge: '',
      portOfLoading: '',
      placeOfReceipt: '',
    },
  });

  // Update form when data loads
  useEffect(() => {
    if (existingMBL) {
      form.reset({
        portOfDestination: existingMBL.portOfDestination ?? '',
        countryOfDestination: existingMBL.countryOfDestination ?? '',
        portOfDischarge: existingMBL.portOfDischarge ?? '',
        portOfLoading: existingMBL.portOfLoading ?? '',
        placeOfReceipt: existingMBL.placeOfReceipt ?? '',
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
    <form onSubmit={form.handleSubmit(handleSave)}>
      <FreightSection
        title={t('title')}
        description={t('description')}
        actions={
          <Button
            type="submit"
            disabled={isSaving || !isDirty}
            size="sm"
            variant="default"
          >
            <Save className="mr-2 size-4" />
            {isSaving ? t('saving') : t('save')}
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          {/* 目的港 */}
          <div className="space-y-2">
            <Label htmlFor="portOfDestination">{t('portOfDestination')}</Label>
            <Input
              id="portOfDestination"
              {...form.register('portOfDestination')}
              placeholder={t('portOfDestinationPlaceholder')}
            />
          </div>

          {/* 目的国 */}
          <div className="space-y-2">
            <Label htmlFor="countryOfDestination">
              {t('countryOfDestination')}
            </Label>
            <Input
              id="countryOfDestination"
              {...form.register('countryOfDestination')}
              placeholder={t('countryOfDestinationPlaceholder')}
            />
          </div>

          {/* 卸货港 */}
          <div className="space-y-2">
            <Label htmlFor="portOfDischarge">{t('portOfDischarge')}</Label>
            <Input
              id="portOfDischarge"
              {...form.register('portOfDischarge')}
              placeholder={t('portOfDischargePlaceholder')}
            />
          </div>

          {/* 起运港 */}
          <div className="space-y-2">
            <Label htmlFor="portOfLoading">{t('portOfLoading')}</Label>
            <Input
              id="portOfLoading"
              {...form.register('portOfLoading')}
              placeholder={t('portOfLoadingPlaceholder')}
            />
          </div>

          {/* 收货地 */}
          <div className="space-y-2">
            <Label htmlFor="placeOfReceipt">{t('placeOfReceipt')}</Label>
            <Input
              id="placeOfReceipt"
              {...form.register('placeOfReceipt')}
              placeholder={t('placeOfReceiptPlaceholder')}
            />
          </div>
        </div>
      </FreightSection>
    </form>
  );
}

