'use client';

import { AddPartyDialog } from '@/components/freight/shared/add-party-dialog';
import type { FreightParty } from '@/lib/freight/api-types';
import { useTranslations } from 'next-intl';

interface AddShipperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (shipper: FreightParty) => void;
}

export function AddShipperDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddShipperDialogProps) {
  const t = useTranslations('Dashboard.freight.inbound');
  return (
    <AddPartyDialog
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      title={t('shipperFields.addNew')}
      description={t('shipperFields.addDescription')}
      defaultRole="SHIPPER"
      submitLabel={t('shipperFields.createSuccess')}
    />
  );
}
