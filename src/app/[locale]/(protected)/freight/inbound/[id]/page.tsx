import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { FreightInboundDetailPageClient } from '@/components/freight/inbound/freight-inbound-detail-page-client';
import { getTranslations } from 'next-intl/server';

interface FreightInboundDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function FreightInboundDetailPage({
  params,
}: FreightInboundDetailPageProps) {
  const { id } = await params;
  const t = await getTranslations('Dashboard.freight');

  const breadcrumbs = [
    { label: t('title'), isCurrentPage: false },
    { label: t('inbound.title'), isCurrentPage: false },
    { label: id, isCurrentPage: true },
  ];

  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <FreightInboundDetailPageClient receiptId={id} />
          </div>
        </div>
      </div>
    </>
  );
}
