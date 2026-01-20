'use client';

import {
  ReceiptBasicInfoEditor,
  type ReceiptEditableKey,
} from '@/components/freight/inbound/receipt-basic-info-editor';
import { EditableTextSection } from '@/components/freight/ui/editable-text-section';
import { FreightSection } from '@/components/freight/ui/freight-section';
import { FreightTableSection } from '@/components/freight/ui/freight-table-section';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useFreightInventoryItems } from '@/hooks/freight/use-freight-inventory-items';
import { useUpdateFreightWarehouseReceipt } from '@/hooks/freight/use-freight-warehouse-receipts';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import type {
  FreightInventoryItem,
  FreightWarehouseReceiptWithRelations,
} from '@/lib/freight/api-types';
import {
  ceilToScaledInt,
  formatCeilFixed,
  formatScaledInt,
} from '@/lib/freight/math';
import {
  ArrowLeft,
  Edit,
  MoreHorizontal,
  Package,
  Plus,
  Trash2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { toast } from 'sonner';

export function ReceiptDetailView({
  receipt,
  onBack,
  onAddItem,
  onEdit,
  onDelete,
  onEditItem,
  onDeleteItem,
  editRequest,
}: {
  receipt: FreightWarehouseReceiptWithRelations;
  onBack: () => void;
  onAddItem: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onEditItem: (item: FreightInventoryItem) => void;
  onDeleteItem: (item: FreightInventoryItem) => void;
  editRequest?: { key: ReceiptEditableKey; nonce: number } | null;
}) {
  const t = useTranslations('Dashboard.freight.inbound');
  const tCommon = useTranslations('Common');
  const tCustomerFields = useTranslations(
    'Dashboard.freight.settings.customers.fields'
  );
  const tCustomerColumns = useTranslations(
    'Dashboard.freight.settings.customers.columns'
  );

  const updateMutation = useUpdateFreightWarehouseReceipt(receipt.id);

  const itemsQuery = useFreightInventoryItems({
    receiptId: receipt.id,
    q: '',
  });

  const items = itemsQuery.data ?? [];

  const renderedItems = useMemo(() => items, [items]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 size-4" />
              {t('receiptActions.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="mr-2 size-4" />
              {t('receiptActions.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <ReceiptBasicInfoEditor receipt={receipt} editRequest={editRequest} />
        <FreightTableSection
          title={t('itemsList.title')}
          icon={Package}
          actions={
            <Button onClick={onAddItem} size="sm">
              <Plus className="mr-2 size-4" />
              {t('items.create')}
            </Button>
          }
        >
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>{t('items.columns.commodity')}</TableHead>
                <TableHead className="text-right">
                  {t('items.columns.initialQty')}
                </TableHead>
                <TableHead>{t('items.columns.unit')}</TableHead>
                <TableHead>{t('items.columns.location')}</TableHead>
                <TableHead className="text-right">
                  {t('items.fields.weightPerUnit')}
                </TableHead>
                <TableHead className="text-right">
                  {t('items.fields.volumePerUnit')}
                </TableHead>
                <TableHead className="w-[72px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemsQuery.isLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <TableRow key={`sk-${idx}`} className="h-14">
                    {Array.from({ length: 7 }).map((__, cIdx) => (
                      <TableCell key={`sk-${idx}-${cIdx}`}>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : itemsQuery.error ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <Empty>
                      <EmptyHeader>
                        <EmptyTitle>{t('items.error')}</EmptyTitle>
                        <EmptyDescription>
                          {getFreightApiErrorMessage(itemsQuery.error)}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : renderedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <Empty>
                      <EmptyHeader>
                        <EmptyTitle>{t('items.empty')}</EmptyTitle>
                        <EmptyDescription>
                          {t('items.emptyHint')}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                renderedItems.map((item) => {
                  const weightPerUnit =
                    item.weightPerUnit != null
                      ? Number(item.weightPerUnit)
                      : undefined;
                  const totalWeightKg =
                    weightPerUnit != null && Number.isFinite(weightPerUnit)
                      ? weightPerUnit * item.initialQty
                      : undefined;

                  const lengthCm =
                    item.lengthCm != null ? Number(item.lengthCm) : undefined;
                  const widthCm =
                    item.widthCm != null ? Number(item.widthCm) : undefined;
                  const heightCm =
                    item.heightCm != null ? Number(item.heightCm) : undefined;
                  const volumePerUnitM3 =
                    lengthCm != null &&
                    widthCm != null &&
                    heightCm != null &&
                    Number.isFinite(lengthCm) &&
                    Number.isFinite(widthCm) &&
                    Number.isFinite(heightCm)
                      ? (lengthCm * widthCm * heightCm) / 1_000_000
                      : undefined;
                  const volumePerUnitScaled =
                    volumePerUnitM3 != null && Number.isFinite(volumePerUnitM3)
                      ? ceilToScaledInt(volumePerUnitM3, 2)
                      : undefined;
                  const totalVolumeScaled =
                    volumePerUnitScaled != null
                      ? volumePerUnitScaled * item.initialQty
                      : undefined;

                  return (
                    <TableRow key={item.id} className="h-14">
                      <TableCell className="font-medium">
                        {item.commodityName ?? '-'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {item.initialQty}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.unit ?? '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.binLocation ?? '-'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {weightPerUnit != null &&
                        Number.isFinite(weightPerUnit) &&
                        totalWeightKg != null ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="block w-full cursor-help text-right tabular-nums">
                                {formatCeilFixed(weightPerUnit, 3)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              sideOffset={6}
                              className="max-w-[320px]"
                            >
                              <div className="space-y-1">
                                <div className="font-medium">
                                  {t('items.columns.totalWeight')}
                                </div>
                                <div className="text-muted-foreground">
                                  {t('items.columns.totalWeight')} ={' '}
                                  {t('items.fields.weightPerUnit')} ×{' '}
                                  {t('items.columns.initialQty')}
                                </div>
                                <div className="font-mono tabular-nums">
                                  {formatCeilFixed(weightPerUnit, 3)} ×{' '}
                                  {item.initialQty} ={' '}
                                  {formatCeilFixed(totalWeightKg, 2)}
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {volumePerUnitScaled != null &&
                        totalVolumeScaled != null ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="block w-full cursor-help text-right tabular-nums">
                                {formatScaledInt(volumePerUnitScaled, 2)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              sideOffset={6}
                              className="max-w-[360px]"
                            >
                              <div className="space-y-1">
                                <div className="font-medium">
                                  {t('items.columns.totalVolume')}
                                </div>
                                <div className="text-muted-foreground">
                                  {t('items.fields.volumePerUnit')} = L × W × H
                                  ÷ 1,000,000
                                </div>
                                <div className="font-mono tabular-nums">
                                  {formatCeilFixed(lengthCm ?? 0, 2)} ×{' '}
                                  {formatCeilFixed(widthCm ?? 0, 2)} ×{' '}
                                  {formatCeilFixed(heightCm ?? 0, 2)} ÷
                                  1,000,000 ={' '}
                                  {formatScaledInt(volumePerUnitScaled, 2)}
                                </div>
                                <div className="text-muted-foreground">
                                  {t('items.columns.totalVolume')} ={' '}
                                  {t('items.fields.volumePerUnit')} ×{' '}
                                  {t('items.columns.initialQty')}
                                </div>
                                <div className="font-mono tabular-nums">
                                  {formatScaledInt(volumePerUnitScaled, 2)} ×{' '}
                                  {item.initialQty} ={' '}
                                  {formatScaledInt(totalVolumeScaled, 2)}
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                            >
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEditItem(item)}>
                              <Edit className="mr-2 size-4" />
                              {t('itemActions.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDeleteItem(item)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 size-4" />
                              {t('itemActions.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </FreightTableSection>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <EditableTextSection
          title={t('internalRemarks')}
          value={receipt.internalRemarks}
          placeholder={t('receipt.fields.internalRemarksPlaceholder')}
          labels={{
            edit: tCommon('edit'),
            cancel: tCommon('cancel'),
            save: tCommon('save'),
            saving: tCommon('saving'),
          }}
          onSave={async (nextValue) => {
            try {
              await updateMutation.mutateAsync({ internalRemarks: nextValue });
              toast.success(t('receiptActions.updateSuccess'));
            } catch (error) {
              const message = getFreightApiErrorMessage(error);
              toast.error(message);
              throw new Error(message);
            }
          }}
        />
        <EditableTextSection
          title={t('remarks')}
          value={receipt.remarks}
          placeholder={t('receipt.fields.remarksPlaceholder')}
          labels={{
            edit: tCommon('edit'),
            cancel: tCommon('cancel'),
            save: tCommon('save'),
            saving: tCommon('saving'),
          }}
          onSave={async (nextValue) => {
            try {
              await updateMutation.mutateAsync({ remarks: nextValue });
              toast.success(t('receiptActions.updateSuccess'));
            } catch (error) {
              const message = getFreightApiErrorMessage(error);
              toast.error(message);
              throw new Error(message);
            }
          }}
        />
      </div>

      <Tabs defaultValue="basic" className="space-y-3">
        <TabsList>
          <TabsTrigger value="basic">{t('detailTabs.basic')}</TabsTrigger>
        </TabsList>
        <TabsContent value="basic">
          <FreightSection title={t('detailSections.contact')}>
            <div className="grid gap-4">
              <div className="space-y-2">
                <div className="text-sm font-semibold">{t('customer')}</div>
                <div className="text-sm text-muted-foreground">
                  {receipt.customer?.name ?? receipt.customer?.code ?? '-'}
                </div>
                <div className="grid grid-cols-[90px_1fr] gap-x-3 gap-y-1 text-sm">
                  <div className="text-muted-foreground">
                    {tCustomerColumns('contact')}
                  </div>
                  <div className="whitespace-pre-wrap break-words">
                    {typeof receipt.customer?.contactInfo === 'string'
                      ? receipt.customer.contactInfo
                      : receipt.customer?.contactInfo
                        ? JSON.stringify(receipt.customer.contactInfo)
                        : '-'}
                  </div>
                  <div className="text-muted-foreground">
                    {tCustomerFields('address')}
                  </div>
                  <div className="whitespace-pre-wrap break-words">
                    {receipt.customer?.address ?? '-'}
                  </div>
                </div>
              </div>
            </div>
          </FreightSection>
        </TabsContent>
      </Tabs>
    </div>
  );
}
