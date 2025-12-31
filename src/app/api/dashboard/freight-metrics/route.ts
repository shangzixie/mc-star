import { getDb } from '@/db/index';
import {
  inventoryAllocations,
  inventoryItems,
  inventoryMovements,
  warehouseReceipts,
} from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { jsonError, jsonOk } from '@/lib/api/http';
import { RESERVED_ALLOCATION_STATUSES } from '@/lib/freight/constants';
import { inArray, sql } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    await requireUser(request);
    const db = await getDb();

    const [totals] = await db
      .select({
        receiptsCount: sql<number>`count(${warehouseReceipts.id})::int`,
        inventoryItemsCount: sql<number>`(select count(*) from inventory_items)::int`,
        currentStockQty: sql<number>`(select coalesce(sum(current_qty), 0) from inventory_items)::int`,
        reservedAllocationsCount: sql<number>`(select count(*) from inventory_allocations where status = any(${RESERVED_ALLOCATION_STATUSES}))::int`,
        reservedAllocationsQty: sql<number>`(select coalesce(sum(allocated_qty), 0) from inventory_allocations where status = any(${RESERVED_ALLOCATION_STATUSES}))::int`,
        inboundQty30d: sql<number>`(select coalesce(sum(initial_qty), 0) from inventory_items where created_at >= now() - interval '30 days')::int`,
        shippedQty30d: sql<number>`(select coalesce(sum(-qty_delta), 0) from inventory_movements where ref_type = 'SHIP' and created_at >= now() - interval '30 days')::int`,
      })
      .from(warehouseReceipts);

    // 90d timeseries (inbound by inventory item creation; shipped by movement SHIP)
    const series = await db.execute<{
      date: string;
      inboundQty: number;
      shippedQty: number;
    }>(
      sql`
        with dates as (
          select generate_series(
            (date_trunc('day', now()) - interval '89 day')::date,
            (date_trunc('day', now()))::date,
            interval '1 day'
          )::date as d
        ),
        inbound as (
          select
            date_trunc('day', created_at)::date as d,
            coalesce(sum(initial_qty), 0)::int as qty
          from inventory_items
          where created_at >= now() - interval '90 days'
          group by 1
        ),
        shipped as (
          select
            date_trunc('day', created_at)::date as d,
            coalesce(sum(-qty_delta), 0)::int as qty
          from inventory_movements
          where ref_type = 'SHIP'
            and created_at >= now() - interval '90 days'
          group by 1
        )
        select
          dates.d::text as date,
          coalesce(inbound.qty, 0)::int as "inboundQty",
          coalesce(shipped.qty, 0)::int as "shippedQty"
        from dates
        left join inbound using (d)
        left join shipped using (d)
        order by dates.d asc
      `
    );

    return jsonOk({
      data: {
        totals: totals ?? {
          receiptsCount: 0,
          inventoryItemsCount: 0,
          currentStockQty: 0,
          reservedAllocationsCount: 0,
          reservedAllocationsQty: 0,
          inboundQty30d: 0,
          shippedQty30d: 0,
        },
        series: series as unknown as Array<{
          date: string;
          inboundQty: number;
          shippedQty: number;
        }>,
      },
    });
  } catch (error) {
    return jsonError(error as Error);
  }
}


