import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { FreightInboundPageClient } from '@/components/freight/inbound/freight-inbound-page-client';
import { getTranslations } from 'next-intl/server';

export default async function FreightInboundPage() {
  const t = await getTranslations('Dashboard.freight');

  const breadcrumbs = [
    { label: t('title'), isCurrentPage: false },
    { label: t('inbound.title'), isCurrentPage: true },
  ];

  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <FreightInboundPageClient />
          </div>
        </div>
      </div>
    </>
  );
}
