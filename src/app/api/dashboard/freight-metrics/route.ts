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

    const [receiptTotals] = await db.select({
      receiptsCount: sql<number>`count(*)::int`,
    }).from(warehouseReceipts);

    const [inventoryTotals] = await db
      .select({
        inventoryItemsCount: sql<number>`count(*)::int`,
        currentStockQty: sql<number>`coalesce(sum(${inventoryItems.currentQty}), 0)::int`,
        inboundQty30d: sql<number>`coalesce(sum(case when ${inventoryItems.createdAt} >= (now() - interval '30 days') then ${inventoryItems.initialQty} else 0 end), 0)::int`,
      })
      .from(inventoryItems);

    const [movementTotals] = await db
      .select({
        shippedQty30d: sql<number>`coalesce(sum(case when ${inventoryMovements.refType} = 'SHIP' and ${inventoryMovements.createdAt} >= (now() - interval '30 days') then -${inventoryMovements.qtyDelta} else 0 end), 0)::int`,
      })
      .from(inventoryMovements);

    const [allocationTotals] = await db
      .select({
        reservedAllocationsCount: sql<number>`count(*)::int`,
        reservedAllocationsQty: sql<number>`coalesce(sum(${inventoryAllocations.allocatedQty}), 0)::int`,
      })
      .from(inventoryAllocations)
      .where(
        inArray(inventoryAllocations.status, [...RESERVED_ALLOCATION_STATUSES])
      );

    const totals = {
      receiptsCount: receiptTotals?.receiptsCount ?? 0,
      inventoryItemsCount: inventoryTotals?.inventoryItemsCount ?? 0,
      currentStockQty: inventoryTotals?.currentStockQty ?? 0,
      reservedAllocationsCount: allocationTotals?.reservedAllocationsCount ?? 0,
      reservedAllocationsQty: allocationTotals?.reservedAllocationsQty ?? 0,
      inboundQty30d: inventoryTotals?.inboundQty30d ?? 0,
      shippedQty30d: movementTotals?.shippedQty30d ?? 0,
    };

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
        totals,
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


