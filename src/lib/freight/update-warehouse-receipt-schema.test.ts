import assert from 'node:assert/strict';
import test from 'node:test';
import { updateWarehouseReceiptSchema } from './schemas';

test('updateWarehouseReceiptSchema accepts receiptNo updates', () => {
  const parsed = updateWarehouseReceiptSchema.parse({
    receiptNo: 'WR-2026-0008',
  });

  assert.equal(parsed.receiptNo, 'WR-2026-0008');
});

test('updateWarehouseReceiptSchema keeps receiptNo optional for partial edits', () => {
  const parsed = updateWarehouseReceiptSchema.parse({
    remarks: 'only update remarks',
  });

  assert.equal(parsed.remarks, 'only update remarks');
  assert.equal(parsed.receiptNo, undefined);
});
