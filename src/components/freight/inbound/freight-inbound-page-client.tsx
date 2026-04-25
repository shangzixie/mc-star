'use client';

import { BatchEditReceiptsDialog } from '@/components/freight/inbound/batch-edit-receipts-dialog';
import { CreateReceiptDialog } from '@/components/freight/inbound/create-receipt-dialog';
import { ReceiptListView } from '@/components/freight/inbound/receipt-list-view';
import { RepackReceiptDialog } from '@/components/freight/inbound/repack-receipt-dialog';
import { Button } from '@/components/ui/button';
import type { FreightWarehouseReceiptWithRelations } from '@/lib/freight/api-types';
import { formatCeilFixed } from '@/lib/freight/math';
import { cn } from '@/lib/utils';
import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

export function FreightInboundPageClient() {
  const t = useTranslations('Dashboard.freight.inbound');
  const batchT = t as any;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [repackMode, setRepackMode] = useState(false);
  const [repackDialogOpen, setRepackDialogOpen] = useState(false);
  const [batchEditMode, setBatchEditMode] = useState(false);
  const [batchEditDialogOpen, setBatchEditDialogOpen] = useState(false);
  const [exportMode, setExportMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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
    resetSelectionMode();
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

  const resetSelectionMode = () => {
    setRepackMode(false);
    setBatchEditMode(false);
    setBatchEditDialogOpen(false);
    setExportMode(false);
    setSelectedIds([]);
  };

  const handleExportSelected = async () => {
    if (selectedIds.length === 0) return;
    setIsExporting(true);
    try {
      const response = await fetch('/api/freight/warehouse-receipts/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message =
          payload?.error?.message ?? response.statusText ?? t('export.failed');
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download =
        response.headers
          .get('content-disposition')
          ?.match(/filename="([^"]+)"/)?.[1] ?? 'warehouse-receipts.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success(t('export.success'));
      resetSelectionMode();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('export.failed'));
    } finally {
      setIsExporting(false);
    }
  };

  const headerActions = repackMode ? (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={resetSelectionMode}>
        {t('repack.cancel')}
      </Button>
      <Button
        onClick={() => setRepackDialogOpen(true)}
        disabled={selectedIds.length === 0}
      >
        {t('repack.createSelected')}
      </Button>
    </div>
  ) : exportMode ? (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={resetSelectionMode}>
        {t('export.cancel')}
      </Button>
      <Button
        onClick={handleExportSelected}
        disabled={selectedIds.length === 0 || isExporting}
      >
        <Download className="mr-2 size-4" />
        {isExporting ? t('export.exporting') : t('export.createSelected')}
      </Button>
    </div>
  ) : batchEditMode ? (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={resetSelectionMode}>
        {batchT('batchEdit.cancel')}
      </Button>
      <Button
        onClick={() => setBatchEditDialogOpen(true)}
        disabled={selectedIds.length === 0}
      >
        {batchT('batchEdit.startAction')}
      </Button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Button onClick={() => setCreateDialogOpen(true)}>
        {t('receipt.create')}
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          setBatchEditMode(true);
          setSelectedIds([]);
        }}
      >
        {batchT('batchEdit.start')}
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          setExportMode(true);
          setSelectedIds([]);
        }}
      >
        <Download className="mr-2 size-4" />
        {t('export.start')}
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          setRepackMode(true);
          setSelectedIds([]);
        }}
      >
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
  ) : batchEditMode ? (
    <div className="rounded-md border border-muted/40 bg-muted/5 p-3 text-sm text-muted-foreground shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {batchT('batchEdit.selectionSummary.title')}
      </div>
      <div className="mt-2 text-base font-medium text-foreground tabular-nums">
        {batchT('batchEdit.selectionSummary.selected', {
          count: selectedIds.length,
        })}
      </div>
      <p className="mt-2 text-xs">
        {batchT('batchEdit.selectionSummary.hint')}
      </p>
    </div>
  ) : null;

  return (
    <div className="px-4 py-6 lg:px-6">
      <ReceiptListView
        onSelectReceipt={handleSelectReceipt}
        onCreateReceipt={() => setCreateDialogOpen(true)}
        headerActions={headerActions}
        headerExtras={selectionSummaryNode}
        floatingAction={
          repackMode || exportMode || batchEditMode ? null : undefined
        }
        fixedStatus={repackMode || exportMode ? 'INBOUND' : undefined}
        selectionMode={repackMode || exportMode || batchEditMode}
        selectionBlockMerged={repackMode}
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

      <BatchEditReceiptsDialog
        open={batchEditDialogOpen}
        onOpenChange={setBatchEditDialogOpen}
        selectedIds={selectedIds}
        onSuccess={resetSelectionMode}
      />
    </div>
  );
}
