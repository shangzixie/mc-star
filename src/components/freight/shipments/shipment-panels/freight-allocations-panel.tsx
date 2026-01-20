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
  useCancelFreightAllocation,
  useCreateFreightAllocation,
  useFreightAllocationsByShipment,
  useLoadFreightAllocation,
  usePickFreightAllocation,
  useShipFreightAllocation,
  useSplitFreightAllocation,
} from '@/hooks/freight/use-freight-allocations';
import { useFreightContainersByShipment } from '@/hooks/freight/use-freight-containers';
import { useFreightInventoryItems } from '@/hooks/freight/use-freight-inventory-items';
import { formatDate } from '@/lib/formatter';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import { createAllocationSchema } from '@/lib/freight/schemas';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';

type CreateAllocationValues = z.infer<typeof createAllocationSchema>;

function AllocationActionDialog({
  title,
  triggerLabel,
  children,
}: {
  title: string;
  triggerLabel: string;
  children: (args: { close: () => void }) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children({ close: () => setOpen(false) })}
      </DialogContent>
    </Dialog>
  );
}

export function FreightAllocationsPanel({
  shipmentId,
}: { shipmentId: string }) {
  const t = useTranslations('Dashboard.freight.shipments.detail');
  const [inventorySearch, setInventorySearch] = useState('');

  const {
    data: allocations,
    isLoading,
    error,
  } = useFreightAllocationsByShipment(shipmentId);
  const { data: containers } = useFreightContainersByShipment(shipmentId);

  const inventoryQueryParams = useMemo(
    () => ({ receiptId: '', q: inventorySearch }),
    [inventorySearch]
  );
  const { data: inventoryItems } =
    useFreightInventoryItems(inventoryQueryParams);

  const createAllocation = useCreateFreightAllocation();
  const pick = usePickFreightAllocation();
  const load = useLoadFreightAllocation();
  const ship = useShipFreightAllocation();
  const cancel = useCancelFreightAllocation();
  const split = useSplitFreightAllocation();

  const createForm = useForm<CreateAllocationValues>({
    resolver: zodResolver(createAllocationSchema),
    defaultValues: {
      shipmentId,
      inventoryItemId: '',
      allocatedQty: 1,
    },
  });

  const onCreate = createForm.handleSubmit(async (values) => {
    try {
      await createAllocation.mutateAsync({ ...values, shipmentId });
      toast.success(t('allocations.created'));
      createForm.reset({ shipmentId, inventoryItemId: '', allocatedQty: 1 });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('allocations.createFailed')
      );
    }
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {t('allocations.description')}
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="secondary">
              {t('allocations.new')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('allocations.new')}</DialogTitle>
            </DialogHeader>

            <form onSubmit={onCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('allocations.fields.inventorySearch')}</Label>
                <Input
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  placeholder={t(
                    'allocations.fields.inventorySearchPlaceholder'
                  )}
                />
                <div className="max-h-40 overflow-auto rounded-md border p-2 text-sm">
                  {(inventoryItems ?? []).length === 0 ? (
                    <div className="text-muted-foreground">
                      {t('allocations.inventoryEmpty')}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {(inventoryItems ?? []).slice(0, 20).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="flex w-full items-center justify-between rounded px-2 py-1 text-left hover:bg-muted"
                          onClick={() =>
                            createForm.setValue('inventoryItemId', item.id)
                          }
                        >
                          <span className="truncate">
                            {item.commodityName || item.id}
                          </span>
                          <span className="text-muted-foreground">
                            {item.currentQty}/{item.initialQty}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('allocations.fields.inventoryItemIdHint')}
                </p>
                <Input
                  value={createForm.watch('inventoryItemId')}
                  onChange={(e) =>
                    createForm.setValue('inventoryItemId', e.target.value)
                  }
                  placeholder={t('allocations.fields.inventoryItemId')}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="allocatedQty">
                    {t('allocations.fields.allocatedQty')}
                  </Label>
                  <Input
                    id="allocatedQty"
                    type="number"
                    min={1}
                    value={createForm.watch('allocatedQty')}
                    onChange={(e) =>
                      createForm.setValue(
                        'allocatedQty',
                        Number(e.target.value)
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="containerId">
                    {t('allocations.fields.containerId')}
                  </Label>
                  <select
                    id="containerId"
                    className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                    value={createForm.watch('containerId') ?? ''}
                    onChange={(e) =>
                      createForm.setValue(
                        'containerId',
                        e.target.value || undefined
                      )
                    }
                  >
                    <option value="">
                      {t('allocations.fields.containerUnassigned')}
                    </option>
                    {(containers ?? []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.containerNo || c.id}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button type="submit" disabled={createAllocation.isPending}>
                  {createAllocation.isPending
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
              <TableHead>{t('allocations.columns.inventoryItemId')}</TableHead>
              <TableHead>{t('allocations.columns.status')}</TableHead>
              <TableHead className="hidden md:table-cell">
                {t('allocations.columns.qty')}
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                {t('allocations.columns.createdAt')}
              </TableHead>
              <TableHead>{t('allocations.columns.actions')}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <TableRow key={`sk-${idx}`}>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-40" />
                  </TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  {getFreightApiErrorMessage(error)}
                </TableCell>
              </TableRow>
            ) : (allocations ?? []).length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  {t('allocations.empty')}
                </TableCell>
              </TableRow>
            ) : (
              (allocations ?? []).map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs">
                    {a.inventoryItemId}
                  </TableCell>
                  <TableCell>{a.status}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {a.allocatedQty} → {a.pickedQty} → {a.loadedQty} →{' '}
                    {a.shippedQty}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {a.createdAt ? formatDate(new Date(a.createdAt)) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <AllocationActionDialog
                        title={t('allocations.actions.pick')}
                        triggerLabel={t('allocations.actions.pick')}
                      >
                        {({ close }) => (
                          <AllocationQtyForm
                            label={t('allocations.fields.pickedQty')}
                            defaultValue={a.allocatedQty}
                            min={0}
                            max={a.allocatedQty}
                            onSubmit={async (qty) => {
                              await pick.mutateAsync({
                                allocationId: a.id,
                                pickedQty: qty,
                              });
                              toast.success(t('allocations.updated'));
                              close();
                            }}
                          />
                        )}
                      </AllocationActionDialog>

                      <AllocationActionDialog
                        title={t('allocations.actions.load')}
                        triggerLabel={t('allocations.actions.load')}
                      >
                        {({ close }) => (
                          <AllocationLoadForm
                            label={t('allocations.fields.loadedQty')}
                            defaultQty={a.pickedQty}
                            max={a.pickedQty}
                            containers={containers ?? []}
                            onSubmit={async (qty, containerId) => {
                              await load.mutateAsync({
                                allocationId: a.id,
                                loadedQty: qty,
                                containerId: containerId || undefined,
                              });
                              toast.success(t('allocations.updated'));
                              close();
                            }}
                          />
                        )}
                      </AllocationActionDialog>

                      <AllocationActionDialog
                        title={t('allocations.actions.ship')}
                        triggerLabel={t('allocations.actions.ship')}
                      >
                        {({ close }) => (
                          <AllocationQtyForm
                            label={t('allocations.fields.shippedQty')}
                            defaultValue={a.loadedQty}
                            min={1}
                            max={a.loadedQty}
                            onSubmit={async (qty) => {
                              await ship.mutateAsync({
                                allocationId: a.id,
                                shippedQty: qty,
                              });
                              toast.success(t('allocations.updated'));
                              close();
                            }}
                          />
                        )}
                      </AllocationActionDialog>

                      <AllocationActionDialog
                        title={t('allocations.actions.split')}
                        triggerLabel={t('allocations.actions.split')}
                      >
                        {({ close }) => (
                          <AllocationSplitForm
                            max={a.allocatedQty - 1}
                            containers={containers ?? []}
                            onSubmit={async (qty, newContainerId) => {
                              await split.mutateAsync({
                                allocationId: a.id,
                                splitQty: qty,
                                newContainerId: newContainerId || undefined,
                              });
                              toast.success(t('allocations.updated'));
                              close();
                            }}
                          />
                        )}
                      </AllocationActionDialog>

                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={cancel.isPending}
                        onClick={async () => {
                          try {
                            await cancel.mutateAsync({ allocationId: a.id });
                            toast.success(t('allocations.updated'));
                          } catch (err) {
                            toast.error(
                              err instanceof Error
                                ? err.message
                                : t('allocations.updateFailed')
                            );
                          }
                        }}
                      >
                        {t('allocations.actions.cancel')}
                      </Button>
                    </div>
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

function AllocationQtyForm({
  label,
  defaultValue,
  min,
  max,
  onSubmit,
}: {
  label: string;
  defaultValue: number;
  min: number;
  max: number;
  onSubmit: (qty: number) => Promise<void>;
}) {
  const t = useTranslations('Dashboard.freight.shipments.detail');
  const [qty, setQty] = useState(defaultValue);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit(qty);
      }}
    >
      <div className="space-y-2">
        <Label>{label}</Label>
        <Input
          type="number"
          min={min}
          max={max}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
        />
        <p className="text-xs text-muted-foreground">
          {t('allocations.qtyHint', { min, max })}
        </p>
      </div>
      <DialogFooter>
        <Button type="submit">{t('common.save')}</Button>
      </DialogFooter>
    </form>
  );
}

function AllocationLoadForm({
  label,
  defaultQty,
  max,
  containers,
  onSubmit,
}: {
  label: string;
  defaultQty: number;
  max: number;
  containers: Array<{ id: string; containerNo: string | null }>;
  onSubmit: (qty: number, containerId: string) => Promise<void>;
}) {
  const t = useTranslations('Dashboard.freight.shipments.detail');
  const [qty, setQty] = useState(defaultQty);
  const [containerId, setContainerId] = useState('');

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit(qty, containerId);
      }}
    >
      <div className="space-y-2">
        <Label>{label}</Label>
        <Input
          type="number"
          min={0}
          max={max}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
        />
        <p className="text-xs text-muted-foreground">
          {t('allocations.qtyHint', { min: 0, max })}
        </p>
      </div>

      <div className="space-y-2">
        <Label>{t('allocations.fields.containerId')}</Label>
        <select
          className="h-9 w-full rounded-md border bg-background px-3 text-sm"
          value={containerId}
          onChange={(e) => setContainerId(e.target.value)}
        >
          <option value="">
            {t('allocations.fields.containerUnassigned')}
          </option>
          {containers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.containerNo || c.id}
            </option>
          ))}
        </select>
      </div>

      <DialogFooter>
        <Button type="submit">{t('common.save')}</Button>
      </DialogFooter>
    </form>
  );
}

function AllocationSplitForm({
  max,
  containers,
  onSubmit,
}: {
  max: number;
  containers: Array<{ id: string; containerNo: string | null }>;
  onSubmit: (splitQty: number, newContainerId: string) => Promise<void>;
}) {
  const t = useTranslations('Dashboard.freight.shipments.detail');
  const [qty, setQty] = useState(Math.max(1, Math.min(1, max)));
  const [containerId, setContainerId] = useState('');

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit(qty, containerId);
      }}
    >
      <div className="space-y-2">
        <Label>{t('allocations.fields.splitQty')}</Label>
        <Input
          type="number"
          min={1}
          max={max}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
        />
        <p className="text-xs text-muted-foreground">
          {t('allocations.qtyHint', { min: 1, max })}
        </p>
      </div>

      <div className="space-y-2">
        <Label>{t('allocations.fields.newContainerId')}</Label>
        <select
          className="h-9 w-full rounded-md border bg-background px-3 text-sm"
          value={containerId}
          onChange={(e) => setContainerId(e.target.value)}
        >
          <option value="">
            {t('allocations.fields.containerUnassigned')}
          </option>
          {containers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.containerNo || c.id}
            </option>
          ))}
        </select>
      </div>

      <DialogFooter>
        <Button type="submit">{t('common.save')}</Button>
      </DialogFooter>
    </form>
  );
}
