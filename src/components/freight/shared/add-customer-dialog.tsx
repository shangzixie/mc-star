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
import { Textarea } from '@/components/ui/textarea';
import { useCreateFreightParty } from '@/hooks/freight/use-freight-master-data';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import { createPartySchema } from '@/lib/freight/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';

interface AddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (customerId: string) => void;
}

type FormValues = z.infer<typeof createPartySchema>;

export function AddCustomerDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddCustomerDialogProps) {
  const t = useTranslations('Dashboard.freight.inbound');
  const tCommon = useTranslations('Common');

  const createMutation = useCreateFreightParty();

  const form = useForm<FormValues>({
    resolver: zodResolver(createPartySchema),
    defaultValues: {
      nameCn: '',
      nameEn: '',
      roles: ['CUSTOMER'],
      contactInfo: {
        phone: '',
        email: '',
      },
      address: '',
      remarks: '',
      isActive: true,
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        nameCn: '',
        nameEn: '',
        roles: ['CUSTOMER'],
        contactInfo: {
          phone: '',
          email: '',
        },
        address: '',
        remarks: '',
        isActive: true,
      });
    }
  }, [open, form]);

  const handleSubmit = async (data: FormValues) => {
    try {
      // Clean up empty contact info
      const payload = { ...data };
      if (
        payload.contactInfo &&
        typeof payload.contactInfo === 'object' &&
        !Array.isArray(payload.contactInfo)
      ) {
        const info = payload.contactInfo as { phone?: string; email?: string };
        if (!info.phone && !info.email) {
          payload.contactInfo = undefined;
        }
      }

      const result = await createMutation.mutateAsync(payload);
      toast.success(t('customerFields.createSuccess'));
      onOpenChange(false);
      onSuccess?.(result.id);
    } catch (error) {
      const message = getFreightApiErrorMessage(error);
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('addNewCustomer')}</DialogTitle>
          <DialogDescription>
            {t('customerFields.addDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Name (Chinese) - Required */}
            <div className="space-y-2">
              <Label htmlFor="nameCn" className="flex items-center gap-1">
                {t('customerFields.nameCn')}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nameCn"
                {...form.register('nameCn')}
                placeholder={t('customerFields.nameCnPlaceholder')}
              />
              {form.formState.errors.nameCn && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.nameCn.message}
                </p>
              )}
            </div>

            {/* Customer Name (English) */}
            <div className="space-y-2">
              <Label htmlFor="nameEn">{t('customerFields.nameEn')}</Label>
              <Input
                id="nameEn"
                {...form.register('nameEn')}
                placeholder={t('customerFields.nameEnPlaceholder')}
              />
            </div>

            {/* Customer Code */}
            <div className="space-y-2">
              <Label htmlFor="code">{t('customerFields.code')}</Label>
              <Input
                id="code"
                {...form.register('code')}
                placeholder={t('customerFields.codePlaceholder')}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">{t('customerFields.phone')}</Label>
              <Input
                id="phone"
                type="tel"
                {...form.register('contactInfo.phone')}
                placeholder={t('customerFields.phonePlaceholder')}
              />
            </div>

            {/* Email */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">{t('customerFields.email')}</Label>
              <Input
                id="email"
                type="email"
                {...form.register('contactInfo.email')}
                placeholder={t('customerFields.emailPlaceholder')}
              />
              {form.formState.errors.contactInfo?.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.contactInfo.email.message}
                </p>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">{t('customerFields.address')}</Label>
            <Textarea
              id="address"
              {...form.register('address')}
              placeholder={t('customerFields.addressPlaceholder')}
              rows={2}
            />
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks">{t('customerFields.remarks')}</Label>
            <Textarea
              id="remarks"
              {...form.register('remarks')}
              placeholder={t('customerFields.remarksPlaceholder')}
              rows={3}
            />
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
