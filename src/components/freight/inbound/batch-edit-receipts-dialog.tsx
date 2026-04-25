'use client';

import { CustomerCombobox } from '@/components/freight/shared/customer-combobox';
import { WarehouseCombobox } from '@/components/freight/shared/warehouse-combobox';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBatchUpdateFreightWarehouseReceipts } from '@/hooks/freight/use-freight-warehouse-receipts';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import { RECEIPT_STATUSES, type ReceiptStatus } from '@/lib/freight/constants';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type BatchEditOperation = 'status' | 'warehouse' | 'customer' | 'contact';
type ContactFieldKey =
  | 'customerPhone'
  | 'shipperPhone'
  | 'bookingAgentPhone'
  | 'customsAgentPhone';

const CONTACT_FIELD_KEYS: ContactFieldKey[] = [
  'customerPhone',
  'shipperPhone',
  'bookingAgentPhone',
  'customsAgentPhone',
];

const INITIAL_CONTACT_ENABLED: Record<ContactFieldKey, boolean> = {
  customerPhone: false,
  shipperPhone: false,
  bookingAgentPhone: false,
  customsAgentPhone: false,
};

const INITIAL_CONTACT_VALUES: Record<ContactFieldKey, string> = {
  customerPhone: '',
  shipperPhone: '',
  bookingAgentPhone: '',
  customsAgentPhone: '',
};

export function BatchEditReceiptsDialog({
  open,
  onOpenChange,
  selectedIds,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onSuccess: () => void;
}) {
  const t = useTranslations('Dashboard.freight.inbound');
  const batchT = t as any;
  const batchUpdateMutation = useBatchUpdateFreightWarehouseReceipts();
  const [operation, setOperation] = useState<BatchEditOperation>('status');
  const [status, setStatus] = useState<ReceiptStatus>('INBOUND');
  const [warehouseId, setWarehouseId] = useState<string | undefined>();
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [contactEnabled, setContactEnabled] = useState(INITIAL_CONTACT_ENABLED);
  const [contactValues, setContactValues] = useState(INITIAL_CONTACT_VALUES);

  useEffect(() => {
    if (!open) return;
    setOperation('status');
    setStatus('INBOUND');
    setWarehouseId(undefined);
    setCustomerId(undefined);
    setContactEnabled(INITIAL_CONTACT_ENABLED);
    setContactValues(INITIAL_CONTACT_VALUES);
  }, [open]);

  const enabledContactCount = useMemo(
    () => CONTACT_FIELD_KEYS.filter((key) => contactEnabled[key]).length,
    [contactEnabled]
  );

  const isSubmitDisabled =
    selectedIds.length === 0 ||
    batchUpdateMutation.isPending ||
    (operation === 'warehouse' && !warehouseId) ||
    (operation === 'customer' && !customerId) ||
    (operation === 'contact' && enabledContactCount === 0);

  const handleSubmit = async () => {
    if (isSubmitDisabled) return;

    try {
      const payload =
        operation === 'status'
          ? {
              ids: selectedIds,
              operation,
              changes: { status },
            }
          : operation === 'warehouse'
            ? {
                ids: selectedIds,
                operation,
                changes: { warehouseId: warehouseId! },
              }
            : operation === 'customer'
              ? {
                  ids: selectedIds,
                  operation,
                  changes: { customerId: customerId! },
                }
              : {
                  ids: selectedIds,
                  operation,
                  changes: {
                    customerPhoneEnabled: contactEnabled.customerPhone,
                    customerPhone: contactValues.customerPhone,
                    shipperPhoneEnabled: contactEnabled.shipperPhone,
                    shipperPhone: contactValues.shipperPhone,
                    bookingAgentPhoneEnabled: contactEnabled.bookingAgentPhone,
                    bookingAgentPhone: contactValues.bookingAgentPhone,
                    customsAgentPhoneEnabled: contactEnabled.customsAgentPhone,
                    customsAgentPhone: contactValues.customsAgentPhone,
                  },
                };

      const result = await batchUpdateMutation.mutateAsync(payload);
      if (result.failureCount === 0) {
        toast.success(
          batchT('batchEdit.success', { count: result.successCount })
        );
      } else {
        toast.error(
          batchT('batchEdit.partial', {
            success: result.successCount,
            failed: result.failureCount,
          })
        );
      }
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(
        getFreightApiErrorMessage(error) || batchT('batchEdit.updateFailed')
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{batchT('batchEdit.title')}</DialogTitle>
          <DialogDescription>
            {batchT('batchEdit.description', { count: selectedIds.length })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="batch-operation">
              {batchT('batchEdit.operation')}
            </Label>
            <Select
              value={operation}
              onValueChange={(value) =>
                setOperation(value as BatchEditOperation)
              }
            >
              <SelectTrigger id="batch-operation">
                <SelectValue placeholder={batchT('batchEdit.operation')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">
                  {batchT('batchEdit.operations.status')}
                </SelectItem>
                <SelectItem value="warehouse">
                  {batchT('batchEdit.operations.warehouse')}
                </SelectItem>
                <SelectItem value="customer">
                  {batchT('batchEdit.operations.customer')}
                </SelectItem>
                <SelectItem value="contact">
                  {batchT('batchEdit.operations.contact')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {operation === 'status' ? (
            <div className="space-y-2">
              <Label htmlFor="batch-status">
                {batchT('batchEdit.fields.status')}
              </Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as ReceiptStatus)}
              >
                <SelectTrigger id="batch-status">
                  <SelectValue
                    placeholder={batchT('batchEdit.fields.status')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {RECEIPT_STATUSES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {t(`status.${item.toLowerCase()}` as never)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {status === 'VOID' ? (
                <p className="text-sm text-red-600">
                  {batchT('batchEdit.voidWarning')}
                </p>
              ) : null}
            </div>
          ) : null}

          {operation === 'warehouse' ? (
            <div className="space-y-2">
              <Label>{batchT('batchEdit.fields.warehouse')}</Label>
              <WarehouseCombobox
                value={warehouseId}
                onValueChange={setWarehouseId}
                placeholder={t('selectWarehouse')}
              />
            </div>
          ) : null}

          {operation === 'customer' ? (
            <div className="space-y-2">
              <Label>{batchT('batchEdit.fields.customer')}</Label>
              <CustomerCombobox
                value={customerId}
                onValueChange={setCustomerId}
                placeholder={t('selectCustomer')}
              />
            </div>
          ) : null}

          {operation === 'contact' ? (
            <div className="space-y-3">
              {CONTACT_FIELD_KEYS.map((key) => (
                <div
                  key={key}
                  className="grid gap-2 rounded-md border p-3 sm:grid-cols-[auto_1fr]"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={contactEnabled[key]}
                      onCheckedChange={(checked) =>
                        setContactEnabled((prev) => ({
                          ...prev,
                          [key]: checked === true,
                        }))
                      }
                      id={`batch-${key}-enabled`}
                    />
                    <Label htmlFor={`batch-${key}-enabled`}>
                      {batchT(`batchEdit.fields.${key}`)}
                    </Label>
                  </div>
                  <Input
                    value={contactValues[key]}
                    onChange={(event) =>
                      setContactValues((prev) => ({
                        ...prev,
                        [key]: event.target.value,
                      }))
                    }
                    disabled={!contactEnabled[key]}
                    placeholder={batchT('batchEdit.phonePlaceholder')}
                  />
                </div>
              ))}
              <p className="text-sm text-muted-foreground">
                {batchT('batchEdit.contactHint')}
              </p>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('receiptActions.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
            {batchUpdateMutation.isPending
              ? batchT('batchEdit.updating')
              : batchT('batchEdit.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
