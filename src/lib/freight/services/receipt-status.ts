import {
  inventoryItems,
  warehouseReceiptStatusLogs,
  warehouseReceipts,
} from '@/db/schema';
import type { SQL } from 'drizzle-orm';
import { and, eq, sql } from 'drizzle-orm';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import type {
  PostgresJsDatabase,
  PostgresJsQueryResultHKT,
} from 'drizzle-orm/postgres-js';
import type { ReceiptStatus } from '../constants';

type DbOrTransaction =
  | PostgresJsDatabase<Record<string, unknown>>
  | PgTransaction<PostgresJsQueryResultHKT, Record<string, unknown>, any>;

/**
 * Calculate the appropriate status for a warehouse receipt based on its inventory items.
 *
 * Logic:
 * - INBOUND: All items have current_qty = initial_qty (nothing shipped)
 * - OUTBOUND: All items have current_qty = 0 (everything shipped)
 * - VOID: Items have been voided or cancelled
 *
 * @param receiptId - UUID of the warehouse receipt
 * @param tx - Database transaction
 * @returns The calculated status
 */
export async function calculateReceiptStatus(
  receiptId: string,
  db: DbOrTransaction
): Promise<ReceiptStatus> {
  // Query all inventory items for this receipt
  const items = await db
    .select({
      initialQty: inventoryItems.initialQty,
      currentQty: inventoryItems.currentQty,
    })
    .from(inventoryItems)
    .where(eq(inventoryItems.receiptId, receiptId));

  // If no items, default to INBOUND
  if (items.length === 0) {
    return 'INBOUND';
  }

  // Check if all items are fully shipped (currentQty = 0)
  const allShipped = items.every((item) => item.currentQty === 0);
  if (allShipped) {
    return 'OUTBOUND';
  }

  // Check if all items are untouched (currentQty = initialQty)
  const allReceived = items.every(
    (item) => item.currentQty === item.initialQty
  );
  if (allReceived) {
    return 'INBOUND';
  }

  // Otherwise, it's outbound (partial shipping is still considered outbound)
  return 'OUTBOUND';
}

/**
 * Update the status of a warehouse receipt based on its current inventory state.
 *
 * This should be called after any operation that changes inventory quantities:
 * - After shipping items (allocation SHIP action)
 * - After adjusting inventory
 * - After deleting inventory items
 *
 * @param receiptId - UUID of the warehouse receipt
 * @param tx - Database transaction
 */
export async function updateReceiptStatus(
  receiptId: string,
  db: DbOrTransaction,
  options?: {
    changedBy?: string | null;
    reason?: string;
    batchId?: string | null;
  }
): Promise<void> {
  const [receipt] = await db
    .select({ status: warehouseReceipts.status })
    .from(warehouseReceipts)
    .where(eq(warehouseReceipts.id, receiptId));

  if (!receipt) {
    return;
  }

  const newStatus = await calculateReceiptStatus(receiptId, db);

  if (newStatus === receipt.status) {
    return;
  }

  await db
    .update(warehouseReceipts)
    .set({ status: newStatus })
    .where(eq(warehouseReceipts.id, receiptId));

  await db.insert(warehouseReceiptStatusLogs).values({
    receiptId,
    fromStatus: receipt.status,
    toStatus: newStatus,
    changedBy: options?.changedBy ?? null,
    reason: options?.reason,
    batchId: options?.batchId ?? null,
  });
}

/**
 * Get aggregated statistics for a warehouse receipt.
 *
 * @param receiptId - UUID of the warehouse receipt
 * @param tx - Database transaction or query builder
 * @returns Aggregated statistics
 */
export async function getReceiptStats(
  receiptId: string,
  db: DbOrTransaction
): Promise<{
  totalItems: number;
  totalInitialQty: number;
  totalCurrentQty: number;
  totalWeight: string | null;
  totalVolume: string | null;
}> {
  const [stats] = await db
    .select({
      totalItems: sql<number>`count(*)::int`,
      totalInitialQty: sql<number>`coalesce(sum(${inventoryItems.initialQty}), 0)::int`,
      totalCurrentQty: sql<number>`coalesce(sum(${inventoryItems.currentQty}), 0)::int`,
      // totalWeight: ceil(totalWeight, 2) where totalWeight = sum(weightPerUnit * qty)
      totalWeight: sql<string>`(ceiling(sum(coalesce(${inventoryItems.weightPerUnit}, 0) * ${inventoryItems.initialQty}) * 100) / 100)::text`,
      // totalVolume: sum(ceil(unitVolumeM3, 2) * qty)
      // unitVolumeM3 = (L*W*H)/1_000_000 where L/W/H are in cm
      totalVolume: sql<string>`(sum(ceiling(((coalesce(${inventoryItems.lengthCm}, 0) * coalesce(${inventoryItems.widthCm}, 0) * coalesce(${inventoryItems.heightCm}, 0)) / 1000000) * 100) * ${inventoryItems.initialQty}) / 100)::text`,
    })
    .from(inventoryItems)
    .where(eq(inventoryItems.receiptId, receiptId));

  return (
    stats ?? {
      totalItems: 0,
      totalInitialQty: 0,
      totalCurrentQty: 0,
      totalWeight: null,
      totalVolume: null,
    }
  );
}
