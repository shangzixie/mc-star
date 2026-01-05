'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function ReceiptStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      className={cn(
        status === 'RECEIVED' &&
          'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
        status === 'PARTIAL' &&
          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
        status === 'SHIPPED' &&
          'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      )}
    >
      {status}
    </Badge>
  );
}
