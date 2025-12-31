'use client';

import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useDashboardFreightMetrics } from '@/hooks/dashboard/use-dashboard-freight-metrics';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from 'next-intl';

export function SectionCards() {
  const t = useTranslations('Dashboard.dashboard');
  const metricsQuery = useDashboardFreightMetrics();
  const totals = metricsQuery.data?.totals;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t('cards.receipts')}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totals ? (
              totals.receiptsCount.toLocaleString()
            ) : (
              <Skeleton className="h-8 w-24" />
            )}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              {t('cards.total')}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {t('cards.receiptsHint')} <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {t('cards.receiptsSub')}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t('cards.inboundQty30d')}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totals ? (
              totals.inboundQty30d.toLocaleString()
            ) : (
              <Skeleton className="h-8 w-24" />
            )}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              {t('cards.last30d')}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {t('cards.inboundHint')} <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {t('cards.inboundSub')}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t('cards.shippedQty30d')}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totals ? (
              totals.shippedQty30d.toLocaleString()
            ) : (
              <Skeleton className="h-8 w-24" />
            )}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              {t('cards.last30d')}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {t('cards.shippedHint')} <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">{t('cards.shippedSub')}</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{t('cards.currentStock')}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totals ? (
              totals.currentStockQty.toLocaleString()
            ) : (
              <Skeleton className="h-8 w-24" />
            )}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {totals ? (
                <>
                  <IconTrendingDown />
                  {t('cards.reserved')}: {totals.reservedAllocationsQty}
                </>
              ) : (
                <>
                  <IconTrendingDown />
                  {t('cards.loading')}
                </>
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {t('cards.currentStockHint')} <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">{t('cards.currentStockSub')}</div>
        </CardFooter>
      </Card>
    </div>
  );
}
