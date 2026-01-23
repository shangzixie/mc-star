'use client';

import { ReceiptListView } from '@/components/freight/inbound/receipt-list-view';
import { MergeReceiptsDialog } from '@/components/freight/shipments/merge-receipts-dialog';
import { Button } from '@/components/ui/button';
import { useLocaleRouter } from '@/i18n/navigation';
import { Routes } from '@/routes';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export function ShipmentsPageClient() {
  const t = useTranslations('Dashboard.freight.shipments');
  const router = useLocaleRouter();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
