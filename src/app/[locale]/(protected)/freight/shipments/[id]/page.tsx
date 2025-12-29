import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { ShipmentDetailPageClient } from '@/components/freight/shipments/shipment-detail-page-client';
import { getTranslations } from 'next-intl/server';

interface FreightShipmentDetailPageProps {
  params: {
    id: string;
  };
}

export default async function FreightShipmentDetailPage({
  params,
}: FreightShipmentDetailPageProps) {
  const t = await getTranslations('Dashboard.freight');

  const breadcrumbs = [
    { label: t('title'), isCurrentPage: false },
    { label: t('shipments.title'), isCurrentPage: false },
    { label: params.id, isCurrentPage: true },
  ];

  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <ShipmentDetailPageClient shipmentId={params.id} />
          </div>
        </div>
      </div>
    </>
  );
}
