'use client';

import { AddReceiptFeeDialog } from '@/components/freight/inbound/add-receipt-fee-dialog';
import { DeleteConfirmDialog } from '@/components/freight/inbound/delete-confirm-dialog';
import { EditReceiptFeeDialog } from '@/components/freight/inbound/edit-receipt-fee-dialog';
import { AddCustomerDialog } from '@/components/freight/shared/add-customer-dialog';
import { FreightTableSection } from '@/components/freight/ui/freight-table-section';
import { Button } from '@/components/ui/button';
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
import {
  useDeleteFreightWarehouseReceiptFee,
  useFreightWarehouseReceiptFees,
} from '@/hooks/freight/use-freight-receipt-fees';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import type { FreightWarehouseReceiptFee } from '@/lib/freight/api-types';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

function displayPartyName(fee: FreightWarehouseReceiptFee) {
  const party = fee.party;
  if (!party || !party.id) return '-';
  return party.name || party.code || party.id;
}

function toStr(v: unknown) {
  if (v == null) return '-';
  if (typeof v === 'string') return v || '-';
  return `${v}`;
}

export function ReceiptFeeManagementTab({ receiptId }: { receiptId: string }) {
  const feesQuery = useFreightWarehouseReceiptFees({ receiptId });
  const fees = feesQuery.data ?? [];

  const arFees = useMemo(
    () => fees.filter((f) => (f.feeType ?? '').toUpperCase() === 'AR'),
    [fees]
  );
  const apFees = useMemo(
    () => fees.filter((f) => (f.feeType ?? '').toUpperCase() === 'AP'),
    [fees]
  );

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addFeeType, setAddFeeType] = useState<'AR' | 'AP'>('AR');

  const [editFee, setEditFee] = useState<FreightWarehouseReceiptFee | null>(
    null
  );

  const [deleteFee, setDeleteFee] = useState<FreightWarehouseReceiptFee | null>(
    null
  );
  const [deleteError, setDeleteError] = useState('');
  const deleteMutation = useDeleteFreightWarehouseReceiptFee(
    receiptId,
    deleteFee?.id ?? ''
  );

  // Party creation flow (reuses AddCustomerDialog)
  const [addPartyOpen, setAddPartyOpen] = useState(false);
  const [addPartyCallback, setAddPartyCallback] = useState<
    ((partyId: string) => void) | null
  >(null);

  const requestAddParty = (onCreated: (partyId: string) => void) => {
    setAddPartyCallback(() => onCreated);
    setAddPartyOpen(true);
  };

  const renderFeesTable = (rows: FreightWarehouseReceiptFee[]) => {
    if (feesQuery.isLoading) {
      return (
        <Table className="min-w-[1200px]">
          <TableHeader className="bg-muted">
            <TableRow>
              {Array.from({ length: 12 }).map((_, idx) => (
                <TableHead key={`skh-${idx}`}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
              <TableHead className="w-[120px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 3 }).map((_, rIdx) => (
              <TableRow key={`skr-${rIdx}`} className="h-12">
                {Array.from({ length: 13 }).map((__, cIdx) => (
                  <TableCell key={`skc-${rIdx}-${cIdx}`}>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    if (feesQuery.error) {
      return (
        <div className="p-6">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>加载失败</EmptyTitle>
              <EmptyDescription>
                {getFreightApiErrorMessage(feesQuery.error)}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      );
    }

    if (rows.length === 0) {
      return (
        <div className="p-6">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>暂无费用</EmptyTitle>
              <EmptyDescription>点击“新增”添加一条费用明细</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      );
    }

    return (
      <Table className="min-w-[1400px]">
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead className="w-[220px]">费用名称</TableHead>
            <TableHead className="w-[100px]">计量单位</TableHead>
            <TableHead className="w-[80px]">币种</TableHead>
            <TableHead className="w-[120px] text-right">价格</TableHead>
            <TableHead className="w-[120px] text-right">数量</TableHead>
            <TableHead className="w-[120px] text-right">原币金额</TableHead>
            <TableHead className="w-[90px]">实收币种</TableHead>
            <TableHead className="w-[120px] text-right">汇率</TableHead>
            <TableHead className="w-[120px] text-right">实收金额</TableHead>
            <TableHead className="w-[90px]">付款方式</TableHead>
            <TableHead className="w-[200px]">付款人/收款人</TableHead>
            <TableHead className="w-[240px]">备注</TableHead>
            <TableHead className="w-[120px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((fee) => (
            <TableRow key={fee.id} className="h-12">
              <TableCell className="font-medium max-w-[220px] truncate">
                {fee.feeName}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {toStr(fee.unit)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {toStr(fee.currency)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {toStr(fee.price)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {toStr(fee.quantity)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {toStr(fee.originalAmount)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {toStr(fee.settledCurrency)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {toStr(fee.exchangeRate)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {toStr(fee.settledAmount)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {toStr(fee.paymentMethod)}
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {displayPartyName(fee)}
              </TableCell>
              <TableCell className="max-w-[240px] truncate text-muted-foreground">
                {toStr(fee.remarks)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    onClick={() => setEditFee(fee)}
                  >
                    <Pencil className="size-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-8 text-destructive"
                    onClick={() => {
                      setDeleteError('');
                      setDeleteFee(fee);
                    }}
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-4">
      <FreightTableSection
        title="应收费用"
        actions={
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setAddFeeType('AR');
              setAddDialogOpen(true);
            }}
          >
            <Plus className="mr-2 size-4" />
            新增
          </Button>
        }
      >
        {renderFeesTable(arFees)}
      </FreightTableSection>

      <FreightTableSection
        title="应付费用"
        actions={
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setAddFeeType('AP');
              setAddDialogOpen(true);
            }}
          >
            <Plus className="mr-2 size-4" />
            新增
          </Button>
        }
      >
        {renderFeesTable(apFees)}
      </FreightTableSection>

      <AddReceiptFeeDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        receiptId={receiptId}
        feeType={addFeeType}
        requestAddParty={requestAddParty}
      />

      {editFee && (
        <EditReceiptFeeDialog
          open={!!editFee}
          onOpenChange={(open) => {
            if (!open) setEditFee(null);
          }}
          receiptId={receiptId}
          fee={editFee}
          requestAddParty={requestAddParty}
        />
      )}

      <DeleteConfirmDialog
        open={!!deleteFee}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteFee(null);
            setDeleteError('');
          }
        }}
        title="删除费用"
        message="确定要删除这条费用明细吗？此操作无法撤销。"
        errorMessage={deleteError}
        confirmText="删除"
        cancelText="取消"
        onConfirm={async () => {
          if (!deleteFee) return;
          try {
            await deleteMutation.mutateAsync();
            toast.success('已删除');
          } catch (error) {
            const message = getFreightApiErrorMessage(error);
            setDeleteError(message);
            throw error;
          }
        }}
      />

      <AddCustomerDialog
        open={addPartyOpen}
        onOpenChange={setAddPartyOpen}
        onSuccess={(partyId) => {
          addPartyCallback?.(partyId);
          setAddPartyCallback(null);
        }}
      />
    </div>
  );
}
