'use client';

import { AddPartyDialog } from '@/components/freight/shared/add-party-dialog';
import type { FreightParty } from '@/lib/freight/api-types';

interface AddAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (agent: FreightParty) => void;
  title: string;
  description: string;
  submitLabel?: string;
}

export function AddAgentDialog({
  open,
  onOpenChange,
  onSuccess,
  title,
  description,
  submitLabel,
}: AddAgentDialogProps) {
  return (
    <AddPartyDialog
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      title={title}
      description={description}
      defaultRole="AGENT"
      submitLabel={submitLabel}
    />
  );
}
