'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useFreightInventoryMovements } from '@/hooks/freight/use-freight-inventory-items';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ArrowDown, ArrowUp, Package } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface InventoryMovementsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemName?: string;
}

export function InventoryMovementsDialog({
  open,
  onOpenChange,
  itemId,
  itemName,
}: InventoryMovementsDialogProps) {
  const t = useTranslations();
  const { data: movements, isLoading } = useFreightInventoryMovements(itemId);

  // Calculate running balance
  const movementsWithBalance = movements?.map((movement, index) => {
    const previousBalance =
      index === movements.length - 1
        ? 0
        : movements.slice(index + 1).reduce((sum, m) => sum + m.qtyDelta, 0);
    return {
      ...movement,
      balance: previousBalance + movement.qtyDelta,
    };
  });

  const getMovementTypeColor = (refType: string) => {
    switch (refType) {
      case 'RECEIPT':
        return 'text-green-600 bg-green-50';
      case 'SHIP':
        return 'text-red-600 bg-red-50';
      case 'ADJUST':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getMovementIcon = (refType: string, qtyDelta: number) => {
    if (refType === 'RECEIPT' || qtyDelta > 0) {
      return <ArrowUp className="size-4" />;
    }
    if (refType === 'SHIP' || qtyDelta < 0) {
      return <ArrowDown className="size-4" />;
    }
    return <Package className="size-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {t('Dashboard.freight.inbound.movements.title')}
          </DialogTitle>
          {itemName && <DialogDescription>{itemName}</DialogDescription>}
        </DialogHeader>

        <div className="max-h-[500px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              {t('Common.loading')}...
            </div>
          ) : !movementsWithBalance || movementsWithBalance.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              {t('Dashboard.freight.inbound.movements.empty')}
            </div>
          ) : (
            <div className="space-y-4">
              {movementsWithBalance.map((movement) => (
                <div
                  key={movement.id}
                  className="flex items-start gap-4 rounded-lg border p-4"
                >
                  <div
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-full',
                      getMovementTypeColor(movement.refType)
                    )}
                  >
                    {getMovementIcon(movement.refType, movement.qtyDelta)}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        {t(
                          `Dashboard.freight.inbound.movements.type.${movement.refType.toLowerCase()}` as any
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {movement.createdAt
                          ? format(
                              new Date(movement.createdAt),
                              'yyyy-MM-dd HH:mm'
                            )
                          : '-'}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div
                        className={cn(
                          'font-semibold',
                          movement.qtyDelta > 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        )}
                      >
                        {movement.qtyDelta > 0 ? '+' : ''}
                        {movement.qtyDelta}
                      </div>
                      <div className="text-muted-foreground">
                        {t('Dashboard.freight.inbound.movements.balance')}:{' '}
                        {movement.balance}
                      </div>
                    </div>

                    {movement.refId && (
                      <div className="text-xs text-muted-foreground">
                        Ref: {movement.refId.slice(0, 8)}...
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('Common.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
