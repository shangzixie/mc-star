import { AdminSection } from '@/components/dashboard/admin-section';
import { ChartAreaInteractive } from '@/components/dashboard/chart-area-interactive';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { FreightRecentActivity } from '@/components/dashboard/freight-recent-activity';
import { SectionCards } from '@/components/dashboard/section-cards';
import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const t = useTranslations();

  const breadcrumbs = [
    {
      label: t('Dashboard.dashboard.title'),
      isCurrentPage: true,
    },
  ];

  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards />
            <AdminSection />
            <div className="px-4 lg:px-6">
              <ChartAreaInteractive />
            </div>
            <FreightRecentActivity />
          </div>
        </div>
      </div>
    </>
  );
}
