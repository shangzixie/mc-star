import assert from 'node:assert/strict';
import test from 'node:test';
import { WAREHOUSE_RECEIPT_RELATION_TYPES } from './receipt-relation-type';

test('warehouse receipt relation types distinguish merge from repack', () => {
  assert.deepEqual(WAREHOUSE_RECEIPT_RELATION_TYPES, ['MERGE', 'REPACK']);
});
