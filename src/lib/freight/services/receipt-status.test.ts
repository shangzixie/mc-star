import assert from 'node:assert';
import { describe, it } from 'node:test';
import { calculateReceiptStatus } from './receipt-status';

// Mock transaction with inventory items
function createMockTx(
  items: Array<{ initialQty: number; currentQty: number }>
) {
  return {
    select: () => ({
      from: () => ({
        where: async () => items,
      }),
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe('calculateReceiptStatus', () => {
  it('should return RECEIVED when all items have full inventory', async () => {
    const tx = createMockTx([
      { initialQty: 100, currentQty: 100 },
      { initialQty: 50, currentQty: 50 },
      { initialQty: 200, currentQty: 200 },
    ]);

    const status = await calculateReceiptStatus('test-receipt-id', tx);
    assert.strictEqual(status, 'RECEIVED');
  });

  it('should return SHIPPED when all items have zero inventory', async () => {
    const tx = createMockTx([
      { initialQty: 100, currentQty: 0 },
      { initialQty: 50, currentQty: 0 },
      { initialQty: 200, currentQty: 0 },
    ]);

    const status = await calculateReceiptStatus('test-receipt-id', tx);
    assert.strictEqual(status, 'SHIPPED');
  });

  it('should return PARTIAL when some items are shipped', async () => {
    const tx = createMockTx([
      { initialQty: 100, currentQty: 50 }, // Partially shipped
      { initialQty: 50, currentQty: 50 }, // Not shipped
      { initialQty: 200, currentQty: 0 }, // Fully shipped
    ]);

    const status = await calculateReceiptStatus('test-receipt-id', tx);
    assert.strictEqual(status, 'PARTIAL');
  });

  it('should return PARTIAL when only some items are fully shipped', async () => {
    const tx = createMockTx([
      { initialQty: 100, currentQty: 100 }, // Not shipped
      { initialQty: 50, currentQty: 0 }, // Fully shipped
    ]);

    const status = await calculateReceiptStatus('test-receipt-id', tx);
    assert.strictEqual(status, 'PARTIAL');
  });

  it('should return RECEIVED when receipt has no items', async () => {
    const tx = createMockTx([]);

    const status = await calculateReceiptStatus('test-receipt-id', tx);
    assert.strictEqual(status, 'RECEIVED');
  });

  it('should return PARTIAL when one item is partially shipped', async () => {
    const tx = createMockTx([{ initialQty: 100, currentQty: 75 }]);

    const status = await calculateReceiptStatus('test-receipt-id', tx);
    assert.strictEqual(status, 'PARTIAL');
  });

  it('should return SHIPPED when single item is fully shipped', async () => {
    const tx = createMockTx([{ initialQty: 100, currentQty: 0 }]);

    const status = await calculateReceiptStatus('test-receipt-id', tx);
    assert.strictEqual(status, 'SHIPPED');
  });

  it('should return RECEIVED when single item is not shipped', async () => {
    const tx = createMockTx([{ initialQty: 100, currentQty: 100 }]);

    const status = await calculateReceiptStatus('test-receipt-id', tx);
    assert.strictEqual(status, 'RECEIVED');
  });
});
