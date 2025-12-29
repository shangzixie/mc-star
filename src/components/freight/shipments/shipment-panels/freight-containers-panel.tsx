'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useCreateFreightContainer,
  useFreightContainersByShipment,
} from '@/hooks/freight/use-freight-containers';
import { formatDate } from '@/lib/formatter';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import { createContainerSchema } from '@/lib/freight/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';

type FormValues = z.infer<typeof createContainerSchema>;

export function FreightContainersPanel({ shipmentId }: { shipmentId: string }) {
  const t = useTranslations('Dashboard.freight.shipments.detail');
  const [open, setOpen] = useState(false);

  const { data, isLoading, error } = useFreightContainersByShipment(shipmentId);
  const createMutation = useCreateFreightContainer();

  const form = useForm<FormValues>({
    resolver: zodResolver(createContainerSchema),
    defaultValues: {
      shipmentId,
      containerNo: '',
      containerType: '',
      sealNo: '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync({ ...values, shipmentId });
      toast.success(t('containers.created'));
      setOpen(false);
      form.reset({
        shipmentId,
        containerNo: '',
        containerType: '',
        sealNo: '',
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('containers.createFailed')
      );
    }
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {t('containers.description')}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="secondary">
              {t('containers.new')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('containers.new')}</DialogTitle>
            </DialogHeader>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="containerNo">
                  {t('containers.fields.containerNo')}
                </Label>
                <Input id="containerNo" {...form.register('containerNo')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="containerType">
                  {t('containers.fields.containerType')}
                </Label>
                <Input id="containerType" {...form.register('containerType')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sealNo">{t('containers.fields.sealNo')}</Label>
                <Input id="sealNo" {...form.register('sealNo')} />
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending
                    ? t('common.saving')
                    : t('common.create')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('containers.columns.containerNo')}</TableHead>
              <TableHead>{t('containers.columns.type')}</TableHead>
              <TableHead className="hidden md:table-cell">
                {t('containers.columns.seal')}
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                {t('containers.columns.createdAt')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <TableRow key={`sk-${idx}`}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-muted-foreground"
                >
                  {getFreightApiErrorMessage(error)}
                </TableCell>
              </TableRow>
            ) : (data ?? []).length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-muted-foreground"
                >
                  {t('containers.empty')}
                </TableCell>
              </TableRow>
            ) : (
              (data ?? []).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    {c.containerNo || '-'}
                  </TableCell>
                  <TableCell>{c.containerType || '-'}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {c.sealNo || '-'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {c.createdAt ? formatDate(new Date(c.createdAt)) : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
