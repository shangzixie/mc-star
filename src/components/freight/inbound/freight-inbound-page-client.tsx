'use client';

import { AddItemDialog } from '@/components/freight/inbound/add-item-dialog';
import { ChangeStatusDialog } from '@/components/freight/inbound/change-status-dialog';
import { CreateReceiptDialog } from '@/components/freight/inbound/create-receipt-dialog';
import { ReceiptDetailView } from '@/components/freight/inbound/receipt-detail-view';
import { ReceiptListView } from '@/components/freight/inbound/receipt-list-view';
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
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DeleteConfirmDialog } from './delete-confirm-dialog';
import { EditItemDialog } from './edit-item-dialog';
import { EditReceiptDialog } from './edit-receipt-dialog';

export function FreightInboundPageClient() {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(
    null
  );
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);

  const [editReceiptOpen, setEditReceiptOpen] = useState(false);
  const [autoOpenEditAfterCreate, setAutoOpenEditAfterCreate] = useState(false);
  const [editItemOpen, setEditItemOpen] = useState(false);
  const [deleteReceiptOpen, setDeleteReceiptOpen] = useState(false);
  const [deleteItemOpen, setDeleteItemOpen] = useState(false);
  const [changeStatusOpen, setChangeStatusOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FreightInventoryItem | null>(
    null
  );
  const [deleteError, setDeleteError] = useState('');

  const t = useTranslations();
  const receiptDetailQuery = useFreightWarehouseReceipt(
    selectedReceiptId ?? ''
  );
  const selectedReceipt = receiptDetailQuery.data ?? null;

  const deleteReceiptMutation = useDeleteFreightWarehouseReceipt(
    selectedReceiptId ?? ''
  );
  const deleteItemMutation = useDeleteFreightInventoryItem(
    selectedItem?.id ?? '',
    selectedReceiptId ?? ''
  );

  const handleSelectReceipt = (receiptId: string) => {
    setSelectedReceiptId(receiptId);
    setView('detail');
  };

  const handleCreateSuccess = (receiptId: string) => {
    setSelectedReceiptId(receiptId);
    setView('detail');
    setAutoOpenEditAfterCreate(true);
  };

  const handleBack = () => {
    setView('list');
    setSelectedReceiptId(null);
    setAutoOpenEditAfterCreate(false);
  };

  useEffect(() => {
    if (autoOpenEditAfterCreate && selectedReceipt) {
      setEditReceiptOpen(true);
      setAutoOpenEditAfterCreate(false);
    }
  }, [autoOpenEditAfterCreate, selectedReceipt]);

  return (
    <div className="px-4 py-6 lg:px-6">
      {view === 'list' ? (
        <ReceiptListView
          onSelectReceipt={handleSelectReceipt}
          onCreateReceipt={() => setCreateDialogOpen(true)}
        />
      ) : receiptDetailQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : selectedReceipt ? (
        <ReceiptDetailView
          receipt={selectedReceipt}
          onBack={handleBack}
          onAddItem={() => setAddItemDialogOpen(true)}
          onEdit={() => setEditReceiptOpen(true)}
          onDelete={() => setDeleteReceiptOpen(true)}
          onChangeStatus={() => setChangeStatusOpen(true)}
          onEditItem={(item) => {
            setSelectedItem(item);
            setEditItemOpen(true);
          }}
          onDeleteItem={(item) => {
            setSelectedItem(item);
            setDeleteItemOpen(true);
          }}
        />
      ) : (
        <div className="py-12">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>
                {t('Dashboard.freight.inbound.receiptList.error')}
              </EmptyTitle>
              <EmptyDescription>
                {receiptDetailQuery.error
                  ? getFreightApiErrorMessage(receiptDetailQuery.error)
                  : t('Dashboard.freight.inbound.receiptList.emptyHint')}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      )}

      <CreateReceiptDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      {selectedReceiptId && (
        <AddItemDialog
          open={addItemDialogOpen}
          onOpenChange={setAddItemDialogOpen}
          receiptId={selectedReceiptId}
        />
      )}

      {selectedReceipt && (
        <EditReceiptDialog
          open={editReceiptOpen}
          onOpenChange={setEditReceiptOpen}
          receipt={selectedReceipt}
        />
      )}

      {selectedItem && (
        <EditItemDialog
          open={editItemOpen}
          onOpenChange={setEditItemOpen}
          item={selectedItem}
        />
      )}

      {selectedReceipt && (
        <DeleteConfirmDialog
          open={deleteReceiptOpen}
          onOpenChange={(open) => {
            setDeleteReceiptOpen(open);
            if (!open) setDeleteError('');
          }}
          title={t('Dashboard.freight.inbound.receiptActions.deleteTitle')}
          message={t('Dashboard.freight.inbound.receiptActions.deleteMessage')}
          errorMessage={deleteError}
          onConfirm={async () => {
            try {
              await deleteReceiptMutation.mutateAsync();
              toast.success(
                t('Dashboard.freight.inbound.receiptActions.deleteSuccess')
              );
              setSelectedReceiptId(null);
              setView('list');
            } catch (error) {
              const message = getFreightApiErrorMessage(error);
              setDeleteError(message);
              throw error;
            }
          }}
        />
      )}

      {selectedItem && selectedReceipt && (
        <DeleteConfirmDialog
          open={deleteItemOpen}
          onOpenChange={(open) => {
            setDeleteItemOpen(open);
            if (!open) setDeleteError('');
          }}
          title={t('Dashboard.freight.inbound.itemActions.deleteTitle')}
          message={t('Dashboard.freight.inbound.itemActions.deleteMessage')}
          errorMessage={deleteError}
          onConfirm={async () => {
            try {
              await deleteItemMutation.mutateAsync();
              toast.success(
                t('Dashboard.freight.inbound.itemActions.deleteSuccess')
              );
            } catch (error) {
              const message = getFreightApiErrorMessage(error);
              setDeleteError(message);
              throw error;
            }
          }}
        />
      )}

      {selectedReceipt && (
        <ChangeStatusDialog
          open={changeStatusOpen}
          onOpenChange={setChangeStatusOpen}
          receipt={selectedReceipt}
        />
      )}
    </div>
  );
}
