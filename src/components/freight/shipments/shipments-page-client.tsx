'use client';

import { ReceiptListView } from '@/components/freight/inbound/receipt-list-view';
import { MergeReceiptsDialog } from '@/components/freight/shipments/merge-receipts-dialog';
import { Button } from '@/components/ui/button';
import { useLocaleRouter } from '@/i18n/navigation';
import { Routes } from '@/routes';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { FreightWarehouseReceiptWithRelations } from '@/lib/freight/api-types';
import { formatCeilFixed } from '@/lib/freight/math';
import { useMemo, useState } from 'react';

export function ShipmentsPageClient() {
  const t = useTranslations('Dashboard.freight.shipments');
  const router = useLocaleRouter();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [visibleReceipts, setVisibleReceipts] = useState<
    FreightWarehouseReceiptWithRelations[]
  >([]);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);

  const handleSelectReceipt = (receiptId: string) => {
    router.push(`${Routes.FreightInbound}/${receiptId}`);
  };

  const handleMergeSuccess = (receiptId: string) => {
    setMergeDialogOpen(false);
    setSelectionMode(false);
    setSelectedIds([]);
    router.push(`${Routes.FreightInbound}/${receiptId}`);
  };

  const selectedReceipts = useMemo(
    () => visibleReceipts.filter((receipt) => selectedIds.includes(receipt.id)),
    [visibleReceipts, selectedIds]
  );

  const selectionTotals = useMemo(() => {
    return {
      pieces: selectedReceipts.reduce(
        (sum, receipt) => sum + (receipt.stats?.totalInitialQty ?? 0),
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
    };
  }, [selectedReceipts]);

  const selectionSummaryNode = useMemo(() => {
    if (!selectionMode || selectedIds.length === 0) {
      return null;
    }

    const isWeightCritical = selectionTotals.weight > 2850;

    return (
      <div className="rounded-md border border-muted/40 bg-muted/5 p-3 text-sm text-muted-foreground shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('selectionSummary.title')}
        </div>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <div>
            <div className="text-xs">{t('selectionSummary.pieces')}</div>
            <div className="text-base font-medium text-foreground tabular-nums">
              {selectionTotals.pieces}
            </div>
          </div>
          <div>
            <div className="text-xs">{t('selectionSummary.weight')}</div>
            <div
              className={cn(
                'text-base font-medium tabular-nums',
                isWeightCritical ? 'text-red-600' : 'text-foreground'
              )}
            >
              {`${formatCeilFixed(selectionTotals.weight, 2)} kg`}
            </div>
          </div>
          <div>
            <div className="text-xs">{t('selectionSummary.volume')}</div>
            <div className="text-base font-medium text-foreground tabular-nums">
              {`${formatCeilFixed(selectionTotals.volume, 2)} m³`}
            </div>
          </div>
        </div>
      </div>
    );
  }, [selectionMode, selectedIds.length, selectionTotals, t]);

  const headerActions = selectionMode ? (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        onClick={() => setSelectionMode(false)}
      >
        {t('merge.cancel')}
      </Button>
      <Button
        onClick={() => setMergeDialogOpen(true)}
        disabled={selectedIds.length === 0}
      >
        {t('merge.create')}
      </Button>
    </div>
  ) : (
    <Button onClick={() => setSelectionMode(true)}>
      {t('merge.start')}
    </Button>
  );

  return (
    <div className="px-4 lg:px-6">
          <ReceiptListView
            onSelectReceipt={handleSelectReceipt}
            title={t('mergePage.title')}
            description={t('mergePage.description')}
            fixedStatus="INBOUND"
            selectionMode={selectionMode}
            onSelectionChange={setSelectedIds}
            selectedIds={selectedIds}
            headerActions={headerActions}
            headerExtras={selectionSummaryNode}
            onReceiptsDataChange={setVisibleReceipts}
            floatingAction={null}
          />

      <MergeReceiptsDialog
        open={mergeDialogOpen}
        onOpenChange={setMergeDialogOpen}
        receiptIds={selectedIds}
        onSuccess={handleMergeSuccess}
      />
    </div>
  );
}
