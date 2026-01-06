'use client';

import { AddItemDialog } from '@/components/freight/inbound/add-item-dialog';
import { DeleteConfirmDialog } from '@/components/freight/inbound/delete-confirm-dialog';
import { EditItemDialog } from '@/components/freight/inbound/edit-item-dialog';
import { ReceiptDetailEditView } from '@/components/freight/inbound/receipt-detail-edit-view';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { useDeleteFreightInventoryItem } from '@/hooks/freight/use-freight-inventory-items';
import {
  useDeleteFreightWarehouseReceipt,
  useFreightWarehouseReceipt,
} from '@/hooks/freight/use-freight-warehouse-receipts';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import type { FreightInventoryItem } from '@/lib/freight/api-types';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export function FreightInboundDetailPageClient({
  receiptId,
}: {
  receiptId: string;
}) {
  const t = useTranslations('Dashboard.freight.inbound');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [editItemOpen, setEditItemOpen] = useState(false);
  const [deleteReceiptOpen, setDeleteReceiptOpen] = useState(false);
  const [deleteItemOpen, setDeleteItemOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState<FreightInventoryItem | null>(
    null
  );
  const [deleteError, setDeleteError] = useState('');

  const receiptDetailQuery = useFreightWarehouseReceipt(receiptId);
  const selectedReceipt = receiptDetailQuery.data ?? null;

  const deleteReceiptMutation = useDeleteFreightWarehouseReceipt(receiptId);
  const deleteItemMutation = useDeleteFreightInventoryItem(
    selectedItem?.id ?? '',
    receiptId
  );

  const listPath = useMemo(() => pathname.replace(/\/[^/]+$/, ''), [pathname]);

  const getBackUrl = () => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete('autoEdit');
    const qs = next.toString();
    return qs ? `${listPath}?${qs}` : listPath;
  };

  const handleBack = () => {
    router.push(getBackUrl());
  };

  if (receiptDetailQuery.isLoading) {
    return (
      <div className="px-4 lg:px-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!selectedReceipt) {
    return (
      <div className="px-4 lg:px-6">
        <div className="py-12">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>{t('receiptList.error')}</EmptyTitle>
              <EmptyDescription>
                {receiptDetailQuery.error
                  ? getFreightApiErrorMessage(receiptDetailQuery.error)
                  : t('receiptList.emptyHint')}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6">
      <ReceiptDetailEditView
        receipt={selectedReceipt}
        onBack={handleBack}
        onAddItem={() => setAddItemDialogOpen(true)}
        onDelete={() => setDeleteReceiptOpen(true)}
        onEditItem={(item) => {
          setSelectedItem(item);
          setEditItemOpen(true);
        }}
        onDeleteItem={(item) => {
          setSelectedItem(item);
          setDeleteItemOpen(true);
        }}
      />

      <AddItemDialog
        open={addItemDialogOpen}
        onOpenChange={setAddItemDialogOpen}
        receiptId={receiptId}
      />

      {selectedItem && (
        <EditItemDialog
          open={editItemOpen}
          onOpenChange={setEditItemOpen}
          item={selectedItem}
        />
      )}

      <DeleteConfirmDialog
        open={deleteReceiptOpen}
        onOpenChange={(open) => {
          setDeleteReceiptOpen(open);
          if (!open) setDeleteError('');
        }}
        title={t('receiptActions.deleteTitle')}
        message={t('receiptActions.deleteMessage')}
        errorMessage={deleteError}
        onConfirm={async () => {
          try {
            await deleteReceiptMutation.mutateAsync();
            toast.success(t('receiptActions.deleteSuccess'));
            router.push(getBackUrl());
          } catch (error) {
            const message = getFreightApiErrorMessage(error);
            setDeleteError(message);
            throw error;
          }
        }}
      />

      {selectedItem && (
        <DeleteConfirmDialog
          open={deleteItemOpen}
          onOpenChange={(open) => {
            setDeleteItemOpen(open);
            if (!open) setDeleteError('');
          }}
          title={t('itemActions.deleteTitle')}
          message={t('itemActions.deleteMessage')}
          errorMessage={deleteError}
          onConfirm={async () => {
            try {
              await deleteItemMutation.mutateAsync();
              toast.success(t('itemActions.deleteSuccess'));
            } catch (error) {
              const message = getFreightApiErrorMessage(error);
              setDeleteError(message);
              throw error;
            }
          }}
        />
      )}
    </div>
  );
}
