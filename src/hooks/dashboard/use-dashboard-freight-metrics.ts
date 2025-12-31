'use client';

import { freightFetch } from '@/lib/freight/api-client';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

const dashboardFreightMetricsSchema = z.object({
  totals: z.object({
    receiptsCount: z.number().int(),
    inventoryItemsCount: z.number().int(),
    currentStockQty: z.number().int(),
    reservedAllocationsCount: z.number().int(),
    reservedAllocationsQty: z.number().int(),
    inboundQty30d: z.number().int(),
    shippedQty30d: z.number().int(),
  }),
  series: z.array(
    z.object({
      date: z.string(),
      inboundQty: z.number().int(),
      shippedQty: z.number().int(),
    })
  ),
});

export type DashboardFreightMetrics = z.infer<
  typeof dashboardFreightMetricsSchema
>;

export function useDashboardFreightMetrics() {
  return useQuery({
    queryKey: ['dashboard', 'freight-metrics'],
    queryFn: async (): Promise<DashboardFreightMetrics> =>
      freightFetch('/api/dashboard/freight-metrics', {
        schema: dashboardFreightMetricsSchema,
      }),
  });
}


