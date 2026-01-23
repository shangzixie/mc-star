'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export function ReceiptStatusBadge({ status }: { status: string }) {
  const t = useTranslations('Dashboard.freight.inbound');

  const statusDisplay = {
    INBOUND: {
      label: t('status.inbound'),
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    },
    OUTBOUND: {
      label: t('status.outbound'),
      color:
        'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    },
    VOID: {
      label: t('status.void'),
      color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    },
  };

  const current = statusDisplay[status as keyof typeof statusDisplay] || {
    label: status,
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
  };

  return <Badge className={current.color}>{current.label}</Badge>;
}
