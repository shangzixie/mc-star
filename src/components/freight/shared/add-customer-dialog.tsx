'use client';

import { AddPartyDialog } from '@/components/freight/shared/add-party-dialog';
import { useTranslations } from 'next-intl';

interface AddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (customerId: string) => void;
}

export function AddCustomerDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddCustomerDialogProps) {
  const t = useTranslations('Dashboard.freight.inbound');
  return (
    <AddPartyDialog
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={(party) => onSuccess?.(party.id)}
      title={t('addNewCustomer')}
      description={t('customerFields.addDescription')}
      defaultRole="CUSTOMER"
      submitLabel={t('customerFields.createSuccess')}
    />
  );
}
