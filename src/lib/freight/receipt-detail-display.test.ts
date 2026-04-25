import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getReceiptDetailItemDisplayMode,
  isRepackParentReceipt,
} from './receipt-detail-display';

test('identifies repack parent receipts from child relation types', () => {
  assert.equal(
    isRepackParentReceipt({
      isMergedParent: true,
      mergedChildren: [
        { id: 'child-1', receiptNo: 'WR-OLD', relationType: 'REPACK' },
      ],
    }),
    true
  );
});

test('repack parent receipts display their own editable inventory items', () => {
  assert.equal(
    getReceiptDetailItemDisplayMode({
      isMergedParent: true,
      mergedChildren: [
        { id: 'child-1', receiptNo: 'WR-OLD', relationType: 'REPACK' },
      ],
    }),
    'own-items'
  );
});

test('merge parent receipts keep the source aggregate item display', () => {
  assert.equal(
    getReceiptDetailItemDisplayMode({
      isMergedParent: true,
      mergedChildren: [
        { id: 'child-1', receiptNo: 'WR-OLD', relationType: 'MERGE' },
      ],
    }),
    'merged-child-items'
  );
});

test('unknown parent relation types preserve merged parent behavior', () => {
  assert.equal(
    getReceiptDetailItemDisplayMode({
      isMergedParent: true,
      mergedChildren: [{ id: 'child-1', receiptNo: 'WR-OLD' }],
    }),
    'merged-child-items'
  );
});
