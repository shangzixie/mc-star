'use client';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useDashboardFreightMetrics } from '@/hooks/dashboard/use-dashboard-freight-metrics';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocale, useTranslations } from 'next-intl';
import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

export function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const t = useTranslations('Dashboard.dashboard');
  const locale = useLocale();
  const [timeRange, setTimeRange] = React.useState('90d');
  const metricsQuery = useDashboardFreightMetrics();

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange('7d');
    }
  }, [isMobile]);

  const all = metricsQuery.data?.series ?? [];
  const days = timeRange === '30d' ? 30 : timeRange === '7d' ? 7 : 90;
  const filteredData = all.slice(-days).map((d) => ({
    date: d.date,
    inbound: d.inboundQty,
    shipped: d.shippedQty,
  }));

  const chartConfig = {
    inbound: {
      label: t('chart.legend.inbound'),
      color: 'var(--primary)',
    },
    shipped: {
      label: t('chart.legend.shipped'),
      color: 'var(--muted-foreground)',
    },
  } satisfies ChartConfig;

  const dateLocale = locale === 'zh' ? 'zh-CN' : 'en-US';

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{t('chart.title')}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {t('chart.description')}
          </span>
          <span className="@[540px]/card:hidden">
            {t('chart.descriptionShort')}
          </span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">
              {t('chart.range.90d')}
            </ToggleGroupItem>
            <ToggleGroupItem value="30d">
              {t('chart.range.30d')}
            </ToggleGroupItem>
            <ToggleGroupItem value="7d">{t('chart.range.7d')}</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label={t('chart.range.ariaLabel')}
            >
              <SelectValue placeholder={t('chart.range.90d')} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                {t('chart.range.90d')}
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                {t('chart.range.30d')}
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                {t('chart.range.7d')}
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillInbound" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-inbound)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-inbound)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillShipped" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-shipped)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-shipped)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString(dateLocale, {
                  month: 'short',
                  day: 'numeric',
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              defaultIndex={isMobile ? -1 : 10}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString(dateLocale, {
                      month: 'short',
                      day: 'numeric',
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="shipped"
              type="natural"
              fill="url(#fillShipped)"
              stroke="var(--color-shipped)"
              stackId="a"
            />
            <Area
              dataKey="inbound"
              type="natural"
              fill="url(#fillInbound)"
              stroke="var(--color-inbound)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
