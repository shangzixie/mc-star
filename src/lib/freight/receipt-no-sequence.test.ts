import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findReceiptNoSequenceGap,
  getReceiptNoSequenceCandidate,
} from './receipt-no-sequence';

test('getReceiptNoSequenceCandidate parses prefix and numeric tail', () => {
  assert.deepEqual(getReceiptNoSequenceCandidate('MC20181011'), {
    prefix: 'MC',
    numericPart: '20181011',
    numericValue: 20181011,
  });
});

test('getReceiptNoSequenceCandidate returns null when there is no numeric tail', () => {
  assert.equal(getReceiptNoSequenceCandidate('MC-SEA'), null);
});

test('findReceiptNoSequenceGap returns expected previous and next receipt number when input skips one', () => {
  assert.deepEqual(
    findReceiptNoSequenceGap({
      receiptNo: 'MC20181012',
      existingReceiptNos: ['MC20181010', 'MC20181009', 'AB0003'],
    }),
    {
      previousReceiptNo: 'MC20181010',
      expectedReceiptNo: 'MC20181011',
    }
  );
});

test('findReceiptNoSequenceGap ignores gaps when input is the next number', () => {
  assert.equal(
    findReceiptNoSequenceGap({
      receiptNo: 'MC20181011',
      existingReceiptNos: ['MC20181010', 'MC20181009', 'AB0003'],
    }),
    null
  );
});

test('findReceiptNoSequenceGap uses the same numeric width when building the expected number', () => {
  assert.deepEqual(
    findReceiptNoSequenceGap({
      receiptNo: 'MC0012',
      existingReceiptNos: ['MC0010', 'MC0009'],
    }),
    {
      previousReceiptNo: 'MC0010',
      expectedReceiptNo: 'MC0011',
    }
  );
});
