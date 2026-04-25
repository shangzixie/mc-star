import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isMissingWarehouseReceiptColumnError,
  omitWarehouseReceiptNewColumnsFromColumnMap,
} from './db-compat';

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

test('matches missing column error with relation-qualified postgres text', () => {
  const error = {
    code: '42703',
    message:
      'column "customer_phone" of relation "warehouse_receipts" does not exist',
  };
  assert.equal(isMissingWarehouseReceiptColumnError(error), true);
});

test('matches missing column error when sqlstate code is missing', () => {
  const error = {
    message: 'column "customer_phone" does not exist',
  };
  assert.equal(isMissingWarehouseReceiptColumnError(error), true);
});

test('matches missing column error when wrapped in cause chain', () => {
  const error = new Error('Failed query');
  (
    error as Error & {
      cause?: { code?: string; message?: string };
    }
  ).cause = {
    code: '42703',
    message:
      'column "customer_phone" of relation "warehouse_receipts" does not exist',
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

test('omits new warehouse receipt columns from column maps for compat returning', () => {
  const safeColumns = omitWarehouseReceiptNewColumnsFromColumnMap({
    id: 'id',
    receiptNo: 'receipt_no',
    customerPhone: 'customer_phone',
    shipperPhone: 'shipper_phone',
    bookingAgentPhone: 'booking_agent_phone',
    customsAgentPhone: 'customs_agent_phone',
    airType: 'air_type',
    courierTrackingNo: 'courier_tracking_no',
    courierReceivedAt: 'courier_received_at',
  });

  assert.deepEqual(safeColumns, {
    id: 'id',
    receiptNo: 'receipt_no',
  });
});
