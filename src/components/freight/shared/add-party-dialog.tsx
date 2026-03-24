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
import type { FreightParty } from '@/lib/freight/api-types';
import { createPartySchema } from '@/lib/freight/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';

type FormValues = z.infer<typeof createPartySchema>;

interface AddPartyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (party: FreightParty) => void;
  title: string;
  description: string;
  defaultRole: 'CUSTOMER' | 'SHIPPER' | 'AGENT';
  submitLabel?: string;
}

export function AddPartyDialog({
  open,
  onOpenChange,
  onSuccess,
  title,
  description,
  defaultRole,
  submitLabel,
}: AddPartyDialogProps) {
  const t = useTranslations('Dashboard.freight.inbound');
  const tCommon = useTranslations('Common');
  const createMutation = useCreateFreightParty();

  const form = useForm<FormValues>({
    resolver: zodResolver(createPartySchema),
    defaultValues: {
      name: '',
      roles: [defaultRole],
      contactInfo: {
        phone: '',
        email: '',
      },
      address: '',
      remarks: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: '',
        roles: [defaultRole],
        contactInfo: {
          phone: '',
          email: '',
        },
        address: '',
        remarks: '',
        isActive: true,
      });
    }
  }, [open, form, defaultRole]);

  const handleSubmit = async (data: FormValues) => {
    try {
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
      toast.success(submitLabel ?? t('customerFields.createSuccess'));
      onOpenChange(false);
      onSuccess?.(result);
    } catch (error) {
      const message = getFreightApiErrorMessage(error);
      toast.error(message);
    }
  };

  const phoneLabel = t('customerFields.phone');
  const phonePlaceholder = t('customerFields.phonePlaceholder');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name" className="flex items-center gap-1">
                {t('customerFields.name')}
              </Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder={t('customerFields.namePlaceholder')}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">{t('customerFields.code')}</Label>
              <Input
                id="code"
                {...form.register('code')}
                placeholder={t('customerFields.codePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{phoneLabel}</Label>
              <Input
                id="phone"
                type="tel"
                {...form.register('contactInfo.phone')}
                placeholder={phonePlaceholder}
              />
            </div>

            <div className="space-y-2">
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

          <div className="space-y-2">
            <Label htmlFor="address">{t('customerFields.address')}</Label>
            <Textarea
              id="address"
              {...form.register('address')}
              placeholder={t('customerFields.addressPlaceholder')}
              rows={2}
            />
          </div>

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
