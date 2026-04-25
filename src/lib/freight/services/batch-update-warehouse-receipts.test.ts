import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildBatchWarehouseReceiptUpdateBody,
  runBatchWarehouseReceiptUpdate,
} from './warehouse-receipts';

test('buildBatchWarehouseReceiptUpdateBody only includes enabled contact fields', () => {
  const payload = buildBatchWarehouseReceiptUpdateBody({
    ids: ['550e8400-e29b-41d4-a716-446655440000'],
    operation: 'contact',
    changes: {
      customerPhoneEnabled: true,
      customerPhone: '13800138000',
      shipperPhoneEnabled: false,
      shipperPhone: 'should-not-be-sent',
      bookingAgentPhoneEnabled: true,
      bookingAgentPhone: '',
    },
  });

  assert.deepEqual(payload, {
    customerPhone: '13800138000',
    bookingAgentPhone: null,
  });
});

test('runBatchWarehouseReceiptUpdate keeps processing after individual failures', async () => {
  const payload = { status: 'VOID' as const };
  const calls: string[] = [];

  const result = await runBatchWarehouseReceiptUpdate({
    ids: [
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
    ],
    payload,
    updateOne: async (id) => {
      calls.push(id);
      if (id.endsWith('1')) {
        throw new Error('Cannot modify locked receipt');
      }
      return { id, status: 'VOID' };
    },
  });

  assert.deepEqual(calls, [
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
  ]);
  assert.equal(result.successCount, 2);
  assert.equal(result.failureCount, 1);
  assert.deepEqual(result.results, [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      ok: true,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      ok: false,
      message: 'Cannot modify locked receipt',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      ok: true,
    },
  ]);
});
