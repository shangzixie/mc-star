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
import { useCreateFreightLocation } from '@/hooks/freight/use-freight-master-data';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import { createLocationSchema } from '@/lib/freight/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';

type FormInputValues = z.input<typeof createLocationSchema>;
type FormOutputValues = z.output<typeof createLocationSchema>;

interface AddLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (locationId: string) => void;
}

export function AddLocationDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddLocationDialogProps) {
  const t = useTranslations('Dashboard.freight.inbound');
  const tCommon = useTranslations('Common');
  const createMutation = useCreateFreightLocation();

  const form = useForm<FormInputValues, unknown, FormOutputValues>({
    resolver: zodResolver(createLocationSchema),
    defaultValues: {
      unLocode: '',
      nameCn: '',
      nameEn: '',
      countryCode: '',
      type: 'SEA',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        unLocode: '',
        nameCn: '',
        nameEn: '',
        countryCode: '',
        type: 'SEA',
      });
    }
  }, [open, form]);

  const handleSubmit = async (data: FormOutputValues) => {
    try {
      const payload = {
        ...data,
        unLocode: data.unLocode?.trim() || undefined,
        nameCn: data.nameCn.trim(),
        nameEn: data.nameEn?.trim() || undefined,
        countryCode: data.countryCode?.trim() || undefined,
      };
      const result = await createMutation.mutateAsync(payload);
      toast.success(t('locationActions.createSuccess'));
      onOpenChange(false);
      onSuccess?.(result.id);
    } catch (error) {
      toast.error(getFreightApiErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('locationActions.addPort')}</DialogTitle>
          <DialogDescription>
            {t('locationActions.addDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nameCn">
                {t('locationActions.fields.nameCn')}
              </Label>
              <Input id="nameCn" {...form.register('nameCn')} />
              {form.formState.errors.nameCn && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.nameCn.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="unLocode">
                {t('locationActions.fields.unLocode')}
              </Label>
              <Input id="unLocode" {...form.register('unLocode')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameEn">
                {t('locationActions.fields.nameEn')}
              </Label>
              <Input id="nameEn" {...form.register('nameEn')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="countryCode">
                {t('locationActions.fields.countryCode')}
              </Label>
              <Input id="countryCode" {...form.register('countryCode')} />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              {createMutation.isPending ? tCommon('saving') : tCommon('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
