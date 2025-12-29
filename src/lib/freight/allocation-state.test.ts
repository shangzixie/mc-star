import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertCanAllocate,
  assertCanCancel,
  assertCanLoad,
  assertCanPick,
  assertCanShip,
  assertCanSplit,
  nextStatusAfterLoad,
  nextStatusAfterPick,
  type AllocationRow,
} from './allocation-state';

function baseAllocation(
  overrides: Partial<AllocationRow> = {}
): AllocationRow {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    inventoryItemId: '00000000-0000-0000-0000-000000000010',
    shipmentId: '00000000-0000-0000-0000-000000000020',
    containerId: '00000000-0000-0000-0000-000000000030',
    allocatedQty: 10,
    pickedQty: 0,
    loadedQty: 0,
    shippedQty: 0,
    status: 'ALLOCATED',
    ...overrides,
  };
}

test('assertCanAllocate: rejects over-allocation', () => {
  assert.throws(() => {
    assertCanAllocate({
      requestedQty: 6,
      inventoryCurrentQty: 10,
      inventoryReservedQty: 5,
    });
  });
});

test('assertCanAllocate: accepts when available is enough', () => {
  assert.doesNotThrow(() => {
    assertCanAllocate({
      requestedQty: 5,
      inventoryCurrentQty: 10,
      inventoryReservedQty: 5,
    });
  });
});

test('pick: cannot exceed allocated and must be monotonic', () => {
  const a = baseAllocation({ status: 'ALLOCATED', allocatedQty: 10, pickedQty: 3 });
  assert.throws(() => assertCanPick(a, 11));
  assert.throws(() => assertCanPick(a, 2));
  assert.doesNotThrow(() => assertCanPick(a, 10));
});

test('pick: next status moves to PICKED when qty>0', () => {
  assert.equal(nextStatusAfterPick({ currentStatus: 'ALLOCATED', newPickedQty: 0 }), 'ALLOCATED');
  assert.equal(nextStatusAfterPick({ currentStatus: 'ALLOCATED', newPickedQty: 1 }), 'PICKED');
});

test('load: requires containerId and cannot exceed picked', () => {
  const a = baseAllocation({ status: 'PICKED', pickedQty: 5, containerId: null });
  assert.throws(() => assertCanLoad(a, 1));

  const b = baseAllocation({ status: 'PICKED', pickedQty: 5, containerId: 'c' });
  assert.throws(() => assertCanLoad(b, 6));
  assert.doesNotThrow(() => assertCanLoad(b, 5));
});

test('load: next status moves to LOADED when qty>0', () => {
  assert.equal(nextStatusAfterLoad({ currentStatus: 'PICKED', newLoadedQty: 0 }), 'PICKED');
  assert.equal(nextStatusAfterLoad({ currentStatus: 'PICKED', newLoadedQty: 1 }), 'LOADED');
});

test('ship: only allowed from LOADED and cannot exceed loaded', () => {
  const a = baseAllocation({ status: 'PICKED', loadedQty: 5, pickedQty: 5 });
  assert.throws(() => assertCanShip(a, 1));

  const b = baseAllocation({ status: 'LOADED', loadedQty: 5, pickedQty: 5 });
  assert.throws(() => assertCanShip(b, 6));
  assert.doesNotThrow(() => assertCanShip(b, 5));
});

test('cancel: cannot cancel shipped', () => {
  const a = baseAllocation({ status: 'SHIPPED', shippedQty: 1 });
  assert.throws(() => assertCanCancel(a));
});

test('split: only ALLOCATED with no progress, splitQty must be < allocatedQty', () => {
  const a = baseAllocation({ status: 'ALLOCATED', allocatedQty: 10 });
  assert.doesNotThrow(() => assertCanSplit(a, 1));
  assert.throws(() => assertCanSplit(a, 10));

  const b = baseAllocation({ status: 'PICKED' });
  assert.throws(() => assertCanSplit(b, 1));

  const c = baseAllocation({ status: 'ALLOCATED', pickedQty: 1 });
  assert.throws(() => assertCanSplit(c, 1));
});


