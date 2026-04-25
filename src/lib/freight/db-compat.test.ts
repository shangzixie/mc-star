import assert from 'node:assert/strict';
import test from 'node:test';
import { isMissingWarehouseReceiptColumnError } from './db-compat';

test('matches missing column error with table-qualified column name', () => {
  const error = {
    code: '42703',
    message: 'column warehouse_receipts.customer_phone does not exist',
  };
  assert.equal(isMissingWarehouseReceiptColumnError(error), true);
});

test('matches missing column error without table-qualified column name', () => {
  const error = {
    code: '42703',
    message: 'column "customer_phone" does not exist',
  };
  assert.equal(isMissingWarehouseReceiptColumnError(error), true);
});

test('matches missing column error when sqlstate code is missing', () => {
  const error = {
    message: 'column "customer_phone" does not exist',
  };
  assert.equal(isMissingWarehouseReceiptColumnError(error), true);
});

test('does not match unrelated database errors', () => {
  const error = {
    code: '23505',
    message: 'duplicate key value violates unique constraint',
  };
  assert.equal(isMissingWarehouseReceiptColumnError(error), false);
});

test('does not match missing-column text when sqlstate is not 42703', () => {
  const error = {
    code: '42P01',
    message: 'column "customer_phone" does not exist',
  };
  assert.equal(isMissingWarehouseReceiptColumnError(error), false);
});
