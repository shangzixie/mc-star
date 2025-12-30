import { inventoryItems, warehouseReceipts } from '@/db/schema';
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
 * - RECEIVED: All items have current_qty = initial_qty (nothing shipped)
 * - SHIPPED: All items have current_qty = 0 (everything shipped)
 * - PARTIAL: Some items shipped, some remaining
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

  // If no items, default to RECEIVED
  if (items.length === 0) {
    return 'RECEIVED';
  }

  // Check if all items are fully shipped (currentQty = 0)
  const allShipped = items.every((item) => item.currentQty === 0);
  if (allShipped) {
    return 'SHIPPED';
  }

  // Check if all items are untouched (currentQty = initialQty)
  const allReceived = items.every(
    (item) => item.currentQty === item.initialQty
  );
  if (allReceived) {
    return 'RECEIVED';
  }

  // Otherwise, it's partial
  return 'PARTIAL';
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
  db: DbOrTransaction
): Promise<void> {
  const newStatus = await calculateReceiptStatus(receiptId, db);

  await db
    .update(warehouseReceipts)
    .set({ status: newStatus })
    .where(eq(warehouseReceipts.id, receiptId));
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
}> {
  const [stats] = await db
    .select({
      totalItems: sql<number>`count(*)::int`,
      totalInitialQty: sql<number>`coalesce(sum(${inventoryItems.initialQty}), 0)::int`,
      totalCurrentQty: sql<number>`coalesce(sum(${inventoryItems.currentQty}), 0)::int`,
      totalWeight: sql<string>`sum(coalesce(${inventoryItems.weightPerUnit}, 0) * ${inventoryItems.initialQty})::text`,
    })
    .from(inventoryItems)
    .where(eq(inventoryItems.receiptId, receiptId));

  return (
    stats ?? {
      totalItems: 0,
      totalInitialQty: 0,
      totalCurrentQty: 0,
      totalWeight: null,
    }
  );
}
