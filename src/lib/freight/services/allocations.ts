import { getDb } from '@/db/index';
import {
  containers,
  inventoryAllocations,
  inventoryItems,
  inventoryMovements,
} from '@/db/schema';
import { ApiError } from '@/lib/api/http';
import { and, eq, inArray, sql } from 'drizzle-orm';
import {
  type AllocationRow,
  assertCanAllocate,
  assertCanCancel,
  assertCanLoad,
  assertCanPick,
  assertCanShip,
  assertCanSplit,
  nextStatusAfterLoad,
  nextStatusAfterPick,
} from '../allocation-state';
import { RESERVED_ALLOCATION_STATUSES } from '../constants';

type Tx = Parameters<
  Awaited<ReturnType<typeof getDb>>['transaction']
>[0] extends (tx: infer T) => unknown
  ? T
  : never;

function mapAllocationRow(
  row: typeof inventoryAllocations.$inferSelect
): AllocationRow {
  return {
    id: row.id,
    allocatedQty: row.allocatedQty,
    pickedQty: row.pickedQty,
    loadedQty: row.loadedQty,
    shippedQty: row.shippedQty,
    status: row.status as AllocationRow['status'],
    shipmentId: row.shipmentId,
    containerId: row.containerId,
    inventoryItemId: row.inventoryItemId,
  };
}

async function lockInventoryItem(tx: Tx, inventoryItemId: string) {
  const rows = await tx.execute<{ id: string; current_qty: number }>(
    sql`select id, current_qty from inventory_items where id = ${inventoryItemId} for update`
  );

  const row = (rows as Array<{ id: string; current_qty: number }>)[0];
  if (!row) {
    throw new ApiError({
      status: 404,
      code: 'INVENTORY_ITEM_NOT_FOUND',
      message: 'Inventory item not found',
    });
  }

  return row;
}

async function lockAllocation(tx: Tx, allocationId: string) {
  const rows = await tx.execute<{
    id: string;
    inventory_item_id: string;
    shipment_id: string;
    container_id: string | null;
    allocated_qty: number;
    picked_qty: number;
    loaded_qty: number;
    shipped_qty: number;
    status: string;
  }>(
    sql`select id, inventory_item_id, shipment_id, container_id, allocated_qty, picked_qty, loaded_qty, shipped_qty, status from inventory_allocations where id = ${allocationId} for update`
  );

  const row = (
    rows as Array<{
      id: string;
      inventory_item_id: string;
      shipment_id: string;
      container_id: string | null;
      allocated_qty: number;
      picked_qty: number;
      loaded_qty: number;
      shipped_qty: number;
      status: string;
    }>
  )[0];
  if (!row) {
    throw new ApiError({
      status: 404,
      code: 'ALLOCATION_NOT_FOUND',
      message: 'Allocation not found',
    });
  }

  const mapped: AllocationRow = {
    id: row.id,
    inventoryItemId: row.inventory_item_id,
    shipmentId: row.shipment_id,
    containerId: row.container_id,
    allocatedQty: row.allocated_qty,
    pickedQty: row.picked_qty,
    loadedQty: row.loaded_qty,
    shippedQty: row.shipped_qty,
    status: row.status as AllocationRow['status'],
  };

  return mapped;
}

export async function createAllocation(input: {
  inventoryItemId: string;
  shipmentId: string;
  containerId?: string;
  allocatedQty: number;
}) {
  const db = await getDb();

  return db.transaction(async (tx) => {
    const lockedItem = await lockInventoryItem(tx, input.inventoryItemId);

    const reservedRows = await tx
      .select({
        reserved: sql<number>`coalesce(sum(${inventoryAllocations.allocatedQty}), 0)::int`,
      })
      .from(inventoryAllocations)
      .where(
        and(
          eq(inventoryAllocations.inventoryItemId, input.inventoryItemId),
          inArray(inventoryAllocations.status, [
            ...RESERVED_ALLOCATION_STATUSES,
          ])
        )
      );

    const reservedQty = reservedRows[0]?.reserved ?? 0;

    assertCanAllocate({
      requestedQty: input.allocatedQty,
      inventoryCurrentQty: lockedItem.current_qty,
      inventoryReservedQty: reservedQty,
    });

    if (input.containerId) {
      const [container] = await tx
        .select({ id: containers.id, shipmentId: containers.shipmentId })
        .from(containers)
        .where(eq(containers.id, input.containerId));
      if (!container) {
        throw new ApiError({
          status: 404,
          code: 'CONTAINER_NOT_FOUND',
          message: 'Container not found',
        });
      }
      if (container.shipmentId !== input.shipmentId) {
        throw new ApiError({
          status: 409,
          code: 'CONTAINER_SHIPMENT_MISMATCH',
          message: 'containerId does not belong to shipmentId',
        });
      }
    }

    const [created] = await tx
      .insert(inventoryAllocations)
      .values({
        inventoryItemId: input.inventoryItemId,
        shipmentId: input.shipmentId,
        containerId: input.containerId ?? null,
        allocatedQty: input.allocatedQty,
        pickedQty: 0,
        loadedQty: 0,
        shippedQty: 0,
        status: 'ALLOCATED',
      })
      .returning();

    return mapAllocationRow(created);
  });
}

export async function pickAllocation(input: {
  allocationId: string;
  pickedQty: number;
}) {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const allocation = await lockAllocation(tx, input.allocationId);
    assertCanPick(allocation, input.pickedQty);

    const nextStatus = nextStatusAfterPick({
      currentStatus: allocation.status,
      newPickedQty: input.pickedQty,
    });

    const [updated] = await tx
      .update(inventoryAllocations)
      .set({
        pickedQty: input.pickedQty,
        status: nextStatus,
      })
      .where(eq(inventoryAllocations.id, input.allocationId))
      .returning();

    return mapAllocationRow(updated);
  });
}

export async function loadAllocation(input: {
  allocationId: string;
  loadedQty: number;
  containerId?: string;
}) {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const allocation = await lockAllocation(tx, input.allocationId);

    // allow assigning container at load time
    const containerId = input.containerId ?? allocation.containerId ?? null;
    if (input.containerId) {
      const [container] = await tx
        .select({ id: containers.id, shipmentId: containers.shipmentId })
        .from(containers)
        .where(eq(containers.id, input.containerId));
      if (!container) {
        throw new ApiError({
          status: 404,
          code: 'CONTAINER_NOT_FOUND',
          message: 'Container not found',
        });
      }
      if (container.shipmentId !== allocation.shipmentId) {
        throw new ApiError({
          status: 409,
          code: 'CONTAINER_SHIPMENT_MISMATCH',
          message: 'containerId does not belong to allocation.shipmentId',
        });
      }
    }

    assertCanLoad({ ...allocation, containerId }, input.loadedQty);

    const nextStatus = nextStatusAfterLoad({
      currentStatus: allocation.status,
      newLoadedQty: input.loadedQty,
    });

    const [updated] = await tx
      .update(inventoryAllocations)
      .set({
        containerId,
        loadedQty: input.loadedQty,
        status: nextStatus,
      })
      .where(eq(inventoryAllocations.id, input.allocationId))
      .returning();

    return mapAllocationRow(updated);
  });
}

export async function shipAllocation(input: {
  allocationId: string;
  shippedQty: number;
}) {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const allocation = await lockAllocation(tx, input.allocationId);
    assertCanShip(allocation, input.shippedQty);

    // lock inventory item to serialize deduction
    const lockedItem = await lockInventoryItem(tx, allocation.inventoryItemId);

    if (lockedItem.current_qty < input.shippedQty) {
      throw new ApiError({
        status: 409,
        code: 'INSUFFICIENT_INVENTORY',
        message: 'Not enough inventory to ship',
        details: {
          currentQty: lockedItem.current_qty,
          shippedQty: input.shippedQty,
        },
      });
    }

    // 1) mark allocation shipped
    await tx
      .update(inventoryAllocations)
      .set({
        shippedQty: input.shippedQty,
        status: 'SHIPPED',
      })
      .where(eq(inventoryAllocations.id, input.allocationId));

    // 2) movement audit
    await tx.insert(inventoryMovements).values({
      inventoryItemId: allocation.inventoryItemId,
      refType: 'SHIP',
      refId: allocation.id,
      qtyDelta: -input.shippedQty,
    });

    // 3) deduct inventory balance
    await tx
      .update(inventoryItems)
      .set({
        currentQty: lockedItem.current_qty - input.shippedQty,
      })
      .where(eq(inventoryItems.id, allocation.inventoryItemId));

    const [updated] = await tx
      .select()
      .from(inventoryAllocations)
      .where(eq(inventoryAllocations.id, input.allocationId));

    return mapAllocationRow(updated);
  });
}

export async function cancelAllocation(input: { allocationId: string }) {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const allocation = await lockAllocation(tx, input.allocationId);
    assertCanCancel(allocation);

    const [updated] = await tx
      .update(inventoryAllocations)
      .set({
        status: 'CANCELLED',
      })
      .where(eq(inventoryAllocations.id, input.allocationId))
      .returning();

    return mapAllocationRow(updated);
  });
}

/**
 * Split an ALLOCATED allocation into two allocations, optionally assigning a new container.
 * This is the recommended way to support "one plan -> multiple containers" without changing DB schema.
 */
export async function splitAllocation(input: {
  allocationId: string;
  splitQty: number;
  newContainerId?: string;
}) {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const allocation = await lockAllocation(tx, input.allocationId);
    assertCanSplit(allocation, input.splitQty);

    const newContainerId: string | null = input.newContainerId ?? null;
    if (newContainerId) {
      const [container] = await tx
        .select({ id: containers.id, shipmentId: containers.shipmentId })
        .from(containers)
        .where(eq(containers.id, newContainerId));
      if (!container) {
        throw new ApiError({
          status: 404,
          code: 'CONTAINER_NOT_FOUND',
          message: 'Container not found',
        });
      }
      if (container.shipmentId !== allocation.shipmentId) {
        throw new ApiError({
          status: 409,
          code: 'CONTAINER_SHIPMENT_MISMATCH',
          message: 'newContainerId does not belong to allocation.shipmentId',
        });
      }
    }

    // original allocated decreases
    const remainingQty = allocation.allocatedQty - input.splitQty;
    if (remainingQty <= 0) {
      throw new ApiError({
        status: 409,
        code: 'SPLIT_EXCEEDS_ALLOCATED',
        message: 'splitQty too large',
      });
    }

    const [updatedOriginal] = await tx
      .update(inventoryAllocations)
      .set({ allocatedQty: remainingQty })
      .where(eq(inventoryAllocations.id, allocation.id))
      .returning();

    const [createdSplit] = await tx
      .insert(inventoryAllocations)
      .values({
        inventoryItemId: allocation.inventoryItemId,
        shipmentId: allocation.shipmentId,
        containerId: newContainerId,
        allocatedQty: input.splitQty,
        pickedQty: 0,
        loadedQty: 0,
        shippedQty: 0,
        status: 'ALLOCATED',
      })
      .returning();

    return {
      original: mapAllocationRow(updatedOriginal),
      split: mapAllocationRow(createdSplit),
    };
  });
}
