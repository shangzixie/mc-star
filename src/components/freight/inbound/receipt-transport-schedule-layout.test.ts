import assert from 'node:assert/strict';
import test from 'node:test';
import { RECEIPT_TRANSPORT_SIDEBAR_FIELD_ORDER } from './receipt-transport-schedule-layout';

test('transport sidebar field order places courier info under warehouse name', () => {
  assert.deepEqual(RECEIPT_TRANSPORT_SIDEBAR_FIELD_ORDER, [
    'warehouse',
    'courierTrackingNo',
    'courierReceivedAt',
    'status',
  ]);
});
