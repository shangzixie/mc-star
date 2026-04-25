import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeWarehouseReceiptsSchema } from './schemas';

test('mergeWarehouseReceiptsSchema accepts sea lcl transport type', () => {
  const parsed = mergeWarehouseReceiptsSchema.parse({
    receiptNo: 'WR-MERGE-001',
    transportType: 'SEA_LCL',
    receiptIds: ['550e8400-e29b-41d4-a716-446655440000'],
  });

  assert.equal(parsed.transportType, 'SEA_LCL');
});

test('mergeWarehouseReceiptsSchema rejects non sea lcl transport type', () => {
  assert.throws(() =>
    mergeWarehouseReceiptsSchema.parse({
      receiptNo: 'WR-MERGE-002',
      transportType: 'SEA_FCL',
      receiptIds: ['550e8400-e29b-41d4-a716-446655440000'],
    })
  );
});
