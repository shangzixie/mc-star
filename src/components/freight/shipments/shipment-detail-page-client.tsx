'use client';

import { FreightAllocationsPanel } from '@/components/freight/shipments/shipment-panels/freight-allocations-panel';
import { FreightAttachmentsPanel } from '@/components/freight/shipments/shipment-panels/freight-attachments-panel';
import { FreightContainersPanel } from '@/components/freight/shipments/shipment-panels/freight-containers-panel';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFreightShipment } from '@/hooks/freight/use-freight-shipments';
import { formatDate } from '@/lib/formatter';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import { AlertCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ShipmentDetailPageClient({
  shipmentId,
}: { shipmentId: string }) {
  const t = useTranslations('Dashboard.freight.shipments.detail');
  const { data: shipment, isLoading, error } = useFreightShipment(shipmentId);

  if (isLoading) {
    return (
      <div className="px-4 lg:px-6">
        <div className="space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="px-4 lg:px-6">
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>{t('errorTitle')}</AlertTitle>
          <AlertDescription>
            {getFreightApiErrorMessage(error)}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="font-semibold text-xl">{shipment.jobNo}</h1>
              <Badge variant="secondary">{shipment.status}</Badge>
            </div>

            <div className="text-sm text-muted-foreground">
              {shipment.createdAt
                ? formatDate(new Date(shipment.createdAt))
                : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground md:grid-cols-4">
            <div>
              <div className="text-xs">{t('fields.transportMode')}</div>
              <div className="text-foreground">{shipment.transportMode}</div>
            </div>
            <div>
              <div className="text-xs">{t('fields.mblNo')}</div>
              <div className="text-foreground">{shipment.mblNo || '-'}</div>
            </div>
            <div>
              <div className="text-xs">{t('fields.hblNo')}</div>
              <div className="text-foreground">{shipment.hblNo || '-'}</div>
            </div>
            <div>
              <div className="text-xs">{t('fields.etdEta')}</div>
              <div className="text-foreground">
                {(shipment.etd ? formatDate(new Date(shipment.etd)) : '-') +
                  ' → ' +
                  (shipment.eta ? formatDate(new Date(shipment.eta)) : '-')}
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="containers">
          <TabsList>
            <TabsTrigger value="containers">{t('tabs.containers')}</TabsTrigger>
            <TabsTrigger value="allocations">
              {t('tabs.allocations')}
            </TabsTrigger>
            <TabsTrigger value="attachments">
              {t('tabs.attachments')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="containers" className="mt-4">
            <FreightContainersPanel shipmentId={shipmentId} />
          </TabsContent>
          <TabsContent value="allocations" className="mt-4">
            <FreightAllocationsPanel shipmentId={shipmentId} />
          </TabsContent>
          <TabsContent value="attachments" className="mt-4">
            <FreightAttachmentsPanel shipmentId={shipmentId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
