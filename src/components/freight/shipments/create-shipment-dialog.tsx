'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateFreightShipment } from '@/hooks/freight/use-freight-shipments';
import { useLocaleRouter } from '@/i18n/navigation';
import { SHIPMENT_STATUSES, TRANSPORT_MODES } from '@/lib/freight/constants';
import { createShipmentSchema } from '@/lib/freight/schemas';
import { Routes } from '@/routes';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';

type FormValues = z.infer<typeof createShipmentSchema>;

export function CreateShipmentDialog() {
  const t = useTranslations('Dashboard.freight.shipments');
  const router = useLocaleRouter();
  const [open, setOpen] = useState(false);

  const mutation = useCreateFreightShipment();

  const form = useForm<FormValues>({
    resolver: zodResolver(createShipmentSchema),
    defaultValues: {
      jobNo: '',
      transportMode: 'SEA',
      status: 'DRAFT',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const created = await mutation.mutateAsync(values);
      toast.success(t('created'));
      setOpen(false);
      form.reset();
      router.push(`${Routes.FreightShipments}/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('createFailed'));
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{t('new')}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('new')}</DialogTitle>
          <DialogDescription>{t('newDescription')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="jobNo">{t('fields.jobNo')}</Label>
            <Input id="jobNo" autoComplete="off" {...form.register('jobNo')} />
            {form.formState.errors.jobNo?.message ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.jobNo.message}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="transportMode">{t('fields.transportMode')}</Label>
              <select
                id="transportMode"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                {...form.register('transportMode')}
              >
                {TRANSPORT_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">{t('fields.status')}</Label>
              <select
                id="status"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                {...form.register('status')}
              >
                {SHIPMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('creating') : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
