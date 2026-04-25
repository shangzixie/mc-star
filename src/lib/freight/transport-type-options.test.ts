import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MERGE_RECEIPT_TRANSPORT_TYPES,
  STANDARD_RECEIPT_TRANSPORT_TYPES,
} from './transport-type-options';

test('merge receipt transport types only allow sea lcl', () => {
  assert.deepEqual(MERGE_RECEIPT_TRANSPORT_TYPES, ['SEA_LCL']);
});

test('standard receipt transport types exclude sea lcl', () => {
  assert.deepEqual(STANDARD_RECEIPT_TRANSPORT_TYPES, [
    'SEA_FCL',
    'AIR_FREIGHT',
  ]);
});
