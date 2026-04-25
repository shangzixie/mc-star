'use client';

import { CreateReceiptDialog } from '@/components/freight/inbound/create-receipt-dialog';
import { ReceiptListView } from '@/components/freight/inbound/receipt-list-view';
import { RepackReceiptDialog } from '@/components/freight/inbound/repack-receipt-dialog';
import { Button } from '@/components/ui/button';
import type { FreightWarehouseReceiptWithRelations } from '@/lib/freight/api-types';
import { formatCeilFixed } from '@/lib/freight/math';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

export function FreightInboundPageClient() {
  const t = useTranslations('Dashboard.freight.inbound');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [repackMode, setRepackMode] = useState(false);
  const [repackDialogOpen, setRepackDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [visibleReceipts, setVisibleReceipts] = useState<
    FreightWarehouseReceiptWithRelations[]
  >([]);

  const handleSelectReceipt = (receiptId: string) => {
    const qs = searchParams.toString();
    router.push(
      qs ? `${pathname}/${receiptId}?${qs}` : `${pathname}/${receiptId}`
    );
  };

  const handleCreateSuccess = (receiptId: string) => {
    setRepackMode(false);
    setSelectedIds([]);
    const next = new URLSearchParams(searchParams.toString());
    next.set('autoEdit', '1');
    const qs = next.toString();
    router.push(
      qs ? `${pathname}/${receiptId}?${qs}` : `${pathname}/${receiptId}`
    );
  };

  const selectedReceipts = useMemo(
    () => visibleReceipts.filter((receipt) => selectedIds.includes(receipt.id)),
    [visibleReceipts, selectedIds]
  );

  const selectionTotals = useMemo(
    () => ({
      pieces: selectedReceipts.reduce(
        (sum, receipt) => sum + (receipt.stats?.totalCurrentQty ?? 0),
        0
      ),
      weight: selectedReceipts.reduce(
        (sum, receipt) =>
          sum +
          (receipt.stats?.totalWeight != null
            ? Number(receipt.stats.totalWeight)
            : 0),
        0
      ),
      volume: selectedReceipts.reduce(
        (sum, receipt) =>
          sum +
          (receipt.stats?.totalVolume != null
            ? Number(receipt.stats.totalVolume)
            : 0),
        0
      ),
    }),
    [selectedReceipts]
  );

  const headerActions = repackMode ? (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        onClick={() => {
          setRepackMode(false);
          setSelectedIds([]);
        }}
      >
        {t('repack.cancel')}
      </Button>
      <Button
        onClick={() => setRepackDialogOpen(true)}
        disabled={selectedIds.length === 0}
      >
        {t('repack.createSelected')}
      </Button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Button onClick={() => setCreateDialogOpen(true)}>
        {t('receipt.create')}
      </Button>
      <Button variant="outline" onClick={() => setRepackMode(true)}>
        {t('repack.start')}
      </Button>
    </div>
  );

  const selectionSummaryNode = repackMode ? (
    <div className="rounded-md border border-muted/40 bg-muted/5 p-3 text-sm text-muted-foreground shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t('repack.selectionSummary.title')}
      </div>
      <div className="mt-2 grid gap-3 sm:grid-cols-3">
        <div>
          <div className="text-xs">{t('repack.selectionSummary.pieces')}</div>
          <div className="text-base font-medium text-foreground tabular-nums">
            {selectionTotals.pieces}
          </div>
        </div>
        <div>
          <div className="text-xs">{t('repack.selectionSummary.weight')}</div>
          <div
            className={cn(
              'text-base font-medium tabular-nums',
              selectionTotals.weight > 2850 ? 'text-red-600' : 'text-foreground'
            )}
          >
            {`${formatCeilFixed(selectionTotals.weight, 2)} kg`}
          </div>
        </div>
        <div>
          <div className="text-xs">{t('repack.selectionSummary.volume')}</div>
          <div className="text-base font-medium text-foreground tabular-nums">
            {`${formatCeilFixed(selectionTotals.volume, 2)} m³`}
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs">{t('repack.selectionSummary.warning')}</p>
    </div>
  ) : null;

  return (
    <div className="px-4 py-6 lg:px-6">
      <ReceiptListView
        onSelectReceipt={handleSelectReceipt}
        onCreateReceipt={() => setCreateDialogOpen(true)}
        headerActions={headerActions}
        headerExtras={selectionSummaryNode}
        floatingAction={repackMode ? null : undefined}
        fixedStatus={repackMode ? 'INBOUND' : undefined}
        selectionMode={repackMode}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onReceiptsDataChange={setVisibleReceipts}
      />

      <CreateReceiptDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      <RepackReceiptDialog
        open={repackDialogOpen}
        onOpenChange={setRepackDialogOpen}
        sourceReceiptIds={selectedIds}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
