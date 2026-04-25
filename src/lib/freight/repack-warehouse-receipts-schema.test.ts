import assert from 'node:assert/strict';
import test from 'node:test';
import { repackWarehouseReceiptsSchema } from './schemas';

test('repackWarehouseReceiptsSchema accepts a new receipt number and source receipt ids', () => {
  const parsed = repackWarehouseReceiptsSchema.parse({
    receiptNo: 'WR-REPACK-001',
    sourceReceiptIds: [
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001',
    ],
  });

  assert.equal(parsed.receiptNo, 'WR-REPACK-001');
  assert.deepEqual(parsed.sourceReceiptIds, [
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440001',
  ]);
});

test('repackWarehouseReceiptsSchema rejects empty source receipt selection', () => {
  assert.throws(() =>
    repackWarehouseReceiptsSchema.parse({
      receiptNo: 'WR-REPACK-002',
      sourceReceiptIds: [],
    })
  );
});
