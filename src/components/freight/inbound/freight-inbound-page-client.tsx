'use client';

import { CreateReceiptDialog } from '@/components/freight/inbound/create-receipt-dialog';
import { ReceiptListView } from '@/components/freight/inbound/receipt-list-view';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function FreightInboundPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleSelectReceipt = (receiptId: string) => {
    const qs = searchParams.toString();
    router.push(
      qs ? `${pathname}/${receiptId}?${qs}` : `${pathname}/${receiptId}`
    );
  };

  const handleCreateSuccess = (receiptId: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set('autoEdit', '1');
    const qs = next.toString();
    router.push(
      qs ? `${pathname}/${receiptId}?${qs}` : `${pathname}/${receiptId}`
    );
  };

  return (
    <div className="px-4 py-6 lg:px-6">
      <ReceiptListView
        onSelectReceipt={handleSelectReceipt}
        onCreateReceipt={() => setCreateDialogOpen(true)}
      />

      <CreateReceiptDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
