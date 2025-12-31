'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useFreightInventoryItemAllocations } from '@/hooks/freight/use-freight-inventory-item-allocations';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';

export function AllocationsDialog({
  open,
  onOpenChange,
  itemId,
  itemName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemName?: string;
}) {
  const t = useTranslations('Dashboard.freight.inbound');
  const allocationsQuery = useFreightInventoryItemAllocations(open ? itemId : '');
  const rows = allocationsQuery.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>{t('itemActions.allocationsTitle')}</DialogTitle>
          <DialogDescription>
            {itemName ? `${itemName} · ` : ''}
            {t('itemActions.allocationsDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>{t('allocations.columns.jobNo')}</TableHead>
                <TableHead>{t('allocations.columns.containerNo')}</TableHead>
                <TableHead>{t('allocations.columns.status')}</TableHead>
                <TableHead className="text-right">
                  {t('allocations.columns.allocatedQty')}
                </TableHead>
                <TableHead className="text-right">
                  {t('allocations.columns.pickedQty')}
                </TableHead>
                <TableHead className="text-right">
                  {t('allocations.columns.loadedQty')}
                </TableHead>
                <TableHead className="text-right">
                  {t('allocations.columns.shippedQty')}
                </TableHead>
                <TableHead>{t('allocations.columns.createdAt')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocationsQuery.isLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <TableRow key={`sk-${idx}`} className="h-12">
                    {Array.from({ length: 8 }).map((__, cIdx) => (
                      <TableCell key={`sk-${idx}-${cIdx}`}>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : allocationsQuery.error ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <Empty>
                      <EmptyHeader>
                        <EmptyTitle>{t('allocations.error')}</EmptyTitle>
                        <EmptyDescription>
                          {getFreightApiErrorMessage(allocationsQuery.error)}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <Empty>
                      <EmptyHeader>
                        <EmptyTitle>{t('allocations.empty')}</EmptyTitle>
                        <EmptyDescription>
                          {t('allocations.emptyHint')}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((a) => (
                  <TableRow key={a.id} className="h-12">
                    <TableCell className="font-medium">{a.jobNo}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.containerNo ?? '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.status}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {a.allocatedQty}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {a.pickedQty || '-'}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {a.loadedQty || '-'}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {a.shippedQty || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {a.createdAt
                        ? format(new Date(a.createdAt), 'yyyy-MM-dd HH:mm')
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}


