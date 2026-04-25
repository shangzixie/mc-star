import assert from 'node:assert/strict';
import test from 'node:test';
import { batchUpdateWarehouseReceiptsSchema } from './schemas';

const ids = [
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440001',
];

test('batchUpdateWarehouseReceiptsSchema accepts status updates', () => {
  const parsed = batchUpdateWarehouseReceiptsSchema.parse({
    ids,
    operation: 'status',
    changes: {
      status: 'VOID',
    },
  });

  assert.equal(parsed.operation, 'status');
  assert.equal(parsed.changes.status, 'VOID');
  assert.deepEqual(parsed.ids, ids);
});

test('batchUpdateWarehouseReceiptsSchema accepts contact updates with enabled fields only', () => {
  const parsed = batchUpdateWarehouseReceiptsSchema.parse({
    ids,
    operation: 'contact',
    changes: {
      customerPhoneEnabled: true,
      customerPhone: '13800138000',
      shipperPhoneEnabled: false,
      shipperPhone: '',
    },
  });

  assert.equal(parsed.operation, 'contact');
  assert.equal(parsed.changes.customerPhoneEnabled, true);
  assert.equal(parsed.changes.customerPhone, '13800138000');
});

test('batchUpdateWarehouseReceiptsSchema rejects contact updates without enabled fields', () => {
  assert.throws(() =>
    batchUpdateWarehouseReceiptsSchema.parse({
      ids,
      operation: 'contact',
      changes: {
        customerPhone: '13800138000',
      },
    })
  );
});
