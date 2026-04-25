import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BATCH_EDIT_RECEIPT_OPERATIONS,
  getIsBatchEditSubmitDisabled,
} from './batch-edit-receipts';

test('batch edit operations include delete', () => {
  assert.deepEqual(BATCH_EDIT_RECEIPT_OPERATIONS, [
    'status',
    'warehouse',
    'customer',
    'contact',
    'delete',
  ]);
});

test('delete operation can submit with selected receipts', () => {
  const disabled = getIsBatchEditSubmitDisabled({
    operation: 'delete',
    selectedCount: 3,
    isPending: false,
    warehouseId: undefined,
    customerId: undefined,
    enabledContactCount: 0,
  });

  assert.equal(disabled, false);
});
