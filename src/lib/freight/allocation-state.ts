import { ApiError } from '@/lib/api/http';
import type { AllocationStatus } from './constants';

export type AllocationRow = {
  id: string;
  allocatedQty: number;
  pickedQty: number;
  loadedQty: number;
  shippedQty: number;
  status: AllocationStatus;
  shipmentId: string;
  containerId: string | null;
  inventoryItemId: string;
};

function assertNonNegativeInt(value: number, name: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new ApiError({
      status: 400,
      code: 'INVALID_QUANTITY',
      message: `${name} must be a non-negative integer`,
    });
  }
}

export function assertCanAllocate(params: {
  requestedQty: number;
  inventoryCurrentQty: number;
  inventoryReservedQty: number;
}) {
  const { requestedQty, inventoryCurrentQty, inventoryReservedQty } = params;
  assertNonNegativeInt(requestedQty, 'requestedQty');
  assertNonNegativeInt(inventoryCurrentQty, 'inventoryCurrentQty');
  assertNonNegativeInt(inventoryReservedQty, 'inventoryReservedQty');

  const available = inventoryCurrentQty - inventoryReservedQty;
  if (requestedQty <= 0) {
    throw new ApiError({
      status: 400,
      code: 'INVALID_QUANTITY',
      message: 'requestedQty must be greater than 0',
    });
  }

  if (available < requestedQty) {
    throw new ApiError({
      status: 409,
      code: 'INSUFFICIENT_INVENTORY',
      message: 'Not enough available inventory to allocate',
      details: {
        available,
        requestedQty,
        inventoryCurrentQty,
        inventoryReservedQty,
      },
    });
  }
}

export function assertCanPick(allocation: AllocationRow, newPickedQty: number) {
  assertNonNegativeInt(newPickedQty, 'pickedQty');

  if (allocation.status !== 'ALLOCATED' && allocation.status !== 'PICKED') {
    throw new ApiError({
      status: 409,
      code: 'INVALID_STATE',
      message: `Cannot pick when allocation status is ${allocation.status}`,
    });
  }

  if (newPickedQty > allocation.allocatedQty) {
    throw new ApiError({
      status: 409,
      code: 'PICK_EXCEEDS_ALLOCATED',
      message: 'pickedQty cannot exceed allocatedQty',
      details: {
        allocatedQty: allocation.allocatedQty,
        pickedQty: newPickedQty,
      },
    });
  }

  if (newPickedQty < allocation.pickedQty) {
    throw new ApiError({
      status: 409,
      code: 'QUANTITY_MUST_BE_MONOTONIC',
      message: 'pickedQty cannot decrease',
    });
  }
}

export function nextStatusAfterPick(params: {
  currentStatus: AllocationStatus;
  newPickedQty: number;
}): AllocationStatus {
  if (params.newPickedQty > 0) return 'PICKED';
  return params.currentStatus;
}

export function assertCanLoad(allocation: AllocationRow, newLoadedQty: number) {
  assertNonNegativeInt(newLoadedQty, 'loadedQty');

  if (allocation.status !== 'PICKED' && allocation.status !== 'LOADED') {
    throw new ApiError({
      status: 409,
      code: 'INVALID_STATE',
      message: `Cannot load when allocation status is ${allocation.status}`,
    });
  }

  if (!allocation.containerId) {
    throw new ApiError({
      status: 409,
      code: 'CONTAINER_REQUIRED',
      message: 'containerId is required before loading',
    });
  }

  if (newLoadedQty > allocation.pickedQty) {
    throw new ApiError({
      status: 409,
      code: 'LOAD_EXCEEDS_PICKED',
      message: 'loadedQty cannot exceed pickedQty',
      details: {
        pickedQty: allocation.pickedQty,
        loadedQty: newLoadedQty,
      },
    });
  }

  if (newLoadedQty > allocation.allocatedQty) {
    throw new ApiError({
      status: 409,
      code: 'LOAD_EXCEEDS_ALLOCATED',
      message: 'loadedQty cannot exceed allocatedQty',
      details: {
        allocatedQty: allocation.allocatedQty,
        loadedQty: newLoadedQty,
      },
    });
  }

  if (newLoadedQty < allocation.loadedQty) {
    throw new ApiError({
      status: 409,
      code: 'QUANTITY_MUST_BE_MONOTONIC',
      message: 'loadedQty cannot decrease',
    });
  }
}

export function nextStatusAfterLoad(params: {
  currentStatus: AllocationStatus;
  newLoadedQty: number;
}): AllocationStatus {
  if (params.newLoadedQty > 0) return 'LOADED';
  return params.currentStatus;
}

export function assertCanShip(
  allocation: AllocationRow,
  newShippedQty: number
) {
  assertNonNegativeInt(newShippedQty, 'shippedQty');

  if (allocation.status !== 'LOADED') {
    throw new ApiError({
      status: 409,
      code: 'INVALID_STATE',
      message: `Cannot ship when allocation status is ${allocation.status}`,
    });
  }

  if (newShippedQty > allocation.loadedQty) {
    throw new ApiError({
      status: 409,
      code: 'SHIP_EXCEEDS_LOADED',
      message: 'shippedQty cannot exceed loadedQty',
      details: {
        loadedQty: allocation.loadedQty,
        shippedQty: newShippedQty,
      },
    });
  }

  if (newShippedQty < allocation.shippedQty) {
    throw new ApiError({
      status: 409,
      code: 'QUANTITY_MUST_BE_MONOTONIC',
      message: 'shippedQty cannot decrease',
    });
  }

  if (newShippedQty <= 0) {
    throw new ApiError({
      status: 400,
      code: 'INVALID_QUANTITY',
      message: 'shippedQty must be greater than 0',
    });
  }
}

export function assertCanCancel(allocation: AllocationRow) {
  if (
    allocation.status !== 'ALLOCATED' &&
    allocation.status !== 'PICKED' &&
    allocation.status !== 'LOADED'
  ) {
    throw new ApiError({
      status: 409,
      code: 'INVALID_STATE',
      message: `Cannot cancel when allocation status is ${allocation.status}`,
    });
  }

  if (allocation.shippedQty > 0) {
    throw new ApiError({
      status: 409,
      code: 'ALREADY_SHIPPED',
      message: 'Cannot cancel an allocation that has been shipped',
    });
  }
}

export function assertCanSplit(allocation: AllocationRow, splitQty: number) {
  assertNonNegativeInt(splitQty, 'splitQty');

  if (allocation.status !== 'ALLOCATED') {
    throw new ApiError({
      status: 409,
      code: 'INVALID_STATE',
      message: 'Only ALLOCATED allocations can be split',
    });
  }

  if (
    allocation.pickedQty !== 0 ||
    allocation.loadedQty !== 0 ||
    allocation.shippedQty !== 0
  ) {
    throw new ApiError({
      status: 409,
      code: 'CANNOT_SPLIT_AFTER_PROGRESS',
      message: 'Cannot split an allocation after pick/load/ship has started',
    });
  }

  if (splitQty <= 0) {
    throw new ApiError({
      status: 400,
      code: 'INVALID_QUANTITY',
      message: 'splitQty must be greater than 0',
    });
  }

  if (splitQty >= allocation.allocatedQty) {
    throw new ApiError({
      status: 409,
      code: 'SPLIT_EXCEEDS_ALLOCATED',
      message: 'splitQty must be less than allocatedQty',
      details: {
        allocatedQty: allocation.allocatedQty,
        splitQty,
      },
    });
  }
}
