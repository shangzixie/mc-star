'use client';

import { AddCustomerDialog } from '@/components/freight/shared/add-customer-dialog';
import { CustomerCombobox } from '@/components/freight/shared/customer-combobox';
import {
  EditableFieldList,
  type EditableFieldRowConfig,
} from '@/components/freight/ui/editable-field-list';
import { FreightSection } from '@/components/freight/ui/freight-section';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateFreightWarehouseReceipt } from '@/hooks/freight/use-freight-warehouse-receipts';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import type { FreightWarehouseReceiptWithRelations } from '@/lib/freight/api-types';
import {
  RECEIPT_STATUSES,
  WAREHOUSE_RECEIPT_CUSTOMS_DECLARATION_TYPES,
  WAREHOUSE_RECEIPT_TRANSPORT_TYPES,
} from '@/lib/freight/constants';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

export type ReceiptEditableKey =
  | 'customerId'
  | 'status'
  | 'transportType'
  | 'customsDeclarationType'
  | 'inboundTime';

function formatDateTimeLocalValue(value: string) {
  return format(new Date(value), "yyyy-MM-dd'T'HH:mm");
}

function formatDateTimeDisplay(value: string) {
  return format(new Date(value), 'yyyy-MM-dd HH:mm');
}

export function ReceiptBasicInfoEditor({
  receipt,
  editRequest,
}: {
  receipt: FreightWarehouseReceiptWithRelations;
  editRequest?: { key: ReceiptEditableKey; nonce: number } | null;
}) {
  const t = useTranslations('Dashboard.freight.inbound');
  const tCommon = useTranslations('Common');

  const [addCustomerDialogOpen, setAddCustomerDialogOpen] = useState(false);
  const updateMutation = useUpdateFreightWarehouseReceipt(receipt.id);

  const rows = useMemo<EditableFieldRowConfig[]>(() => {
    return [
      {
        key: 'customerId',
        label: t('customer'),
        getDisplayValue: () =>
          receipt.customer?.nameCn ??
          receipt.customer?.nameEn ??
          receipt.customer?.code ??
          '-',
        getInitialDraftValue: () => receipt.customerId ?? '',
        renderEditor: ({ draft, setDraft, disabled }) => {
          const value = typeof draft === 'string' ? draft : '';
          return (
            <CustomerCombobox
              value={value}
              onValueChange={(v) => setDraft(v ?? '')}
              disabled={disabled}
              onAddNew={() => setAddCustomerDialogOpen(true)}
              placeholder={t('selectCustomer')}
            />
          );
        },
        toPayload: (draft) => {
          if (typeof draft !== 'string') return {};
          if (!draft) return {};
          if (draft === (receipt.customerId ?? '')) return {};
          return { customerId: draft };
        },
      },
      {
        key: 'status',
        label: t('status.label'),
        getDisplayValue: () =>
          receipt.status
            ? t(`status.${receipt.status.toLowerCase()}` as any)
            : '-',
        getInitialDraftValue: () => receipt.status ?? '',
        renderEditor: ({ draft, setDraft, disabled }) => {
          const value = typeof draft === 'string' ? draft : '';
          return (
            <Select
              value={value}
              onValueChange={(v) => setDraft(v)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('status.label')} />
              </SelectTrigger>
              <SelectContent>
                {RECEIPT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`status.${s.toLowerCase()}` as any)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        },
        toPayload: (draft) => {
          if (typeof draft !== 'string') return {};
          if (!draft) return {};
          if (draft === (receipt.status ?? '')) return {};
          return { status: draft };
        },
      },
      {
        key: 'transportType',
        label: t('transportType.label'),
        getDisplayValue: () =>
          receipt.transportType
            ? t(`transportType.options.${receipt.transportType}` as any)
            : '-',
        getInitialDraftValue: () => receipt.transportType ?? '',
        renderEditor: ({ draft, setDraft, disabled }) => {
          const value = typeof draft === 'string' ? draft : '';
          return (
            <Select
              value={value}
              onValueChange={(v) => setDraft(v)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('transportType.placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {WAREHOUSE_RECEIPT_TRANSPORT_TYPES.map((tt) => (
                  <SelectItem key={tt} value={tt}>
                    {t(`transportType.options.${tt}` as any)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        },
        toPayload: (draft) => {
          if (typeof draft !== 'string') return {};
          if (!draft) return {};
          if (draft === (receipt.transportType ?? '')) return {};
          return { transportType: draft };
        },
      },
      {
        key: 'customsDeclarationType',
        label: t('customsDeclarationType.label'),
        getDisplayValue: () =>
          receipt.customsDeclarationType
            ? t(
                `customsDeclarationType.options.${receipt.customsDeclarationType}` as any
              )
            : '-',
        getInitialDraftValue: () => receipt.customsDeclarationType ?? '',
        renderEditor: ({ draft, setDraft, disabled }) => {
          const value = typeof draft === 'string' ? draft : '';
          return (
            <Select
              value={value}
              onValueChange={(v) => setDraft(v)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t('customsDeclarationType.placeholder')}
                />
              </SelectTrigger>
              <SelectContent>
                {WAREHOUSE_RECEIPT_CUSTOMS_DECLARATION_TYPES.map((ct) => (
                  <SelectItem key={ct} value={ct}>
                    {t(`customsDeclarationType.options.${ct}` as any)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        },
        toPayload: (draft) => {
          if (typeof draft !== 'string') return {};
          if (!draft) return {};
          if (draft === (receipt.customsDeclarationType ?? '')) return {};
          return { customsDeclarationType: draft };
        },
      },
      {
        key: 'inboundTime',
        label: t('inboundTime'),
        getDisplayValue: () =>
          receipt.inboundTime
            ? formatDateTimeDisplay(receipt.inboundTime)
            : '-',
        getInitialDraftValue: () =>
          receipt.inboundTime
            ? formatDateTimeLocalValue(receipt.inboundTime)
            : '',
        renderEditor: ({ draft, setDraft, disabled }) => {
          const value = typeof draft === 'string' ? draft : '';
          return (
            <Input
              type="datetime-local"
              value={value}
              onChange={(e) => setDraft(e.target.value)}
              disabled={disabled}
            />
          );
        },
        toPayload: (draft) => {
          if (typeof draft !== 'string') return {};
          if (!draft) return {};
          const prev = receipt.inboundTime
            ? formatDateTimeLocalValue(receipt.inboundTime)
            : '';
          if (draft === prev) return {};
          return { inboundTime: draft };
        },
      },
    ] as const;
  }, [receipt, t]);

  return (
    <FreightSection title={t('receipt.fields.receiptNo')}>
      <div className="space-y-4">
        <div className="text-lg font-semibold">{receipt.receiptNo}</div>

        <EditableFieldList
          rows={rows}
          editRequest={editRequest}
          labels={{
            edit: tCommon('edit'),
            cancel: tCommon('cancel'),
            save: tCommon('save'),
            saving: tCommon('saving'),
          }}
          onSave={async ({ payload }) => {
            try {
              await updateMutation.mutateAsync(payload);
              toast.success(t('receiptActions.updateSuccess'));
            } catch (error) {
              toast.error(getFreightApiErrorMessage(error));
              throw error;
            }
          }}
        />
      </div>

      {/* Add Customer Dialog */}
      <AddCustomerDialog
        open={addCustomerDialogOpen}
        onOpenChange={setAddCustomerDialogOpen}
        onSuccess={(customerId) => {
          // The dialog will trigger cache invalidation automatically
          // The user can then select the newly created customer
          toast.success(t('customerFields.createSuccessAndSelect'));
        }}
      />
    </FreightSection>
  );
}
