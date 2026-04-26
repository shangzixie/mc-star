import { requireUser } from '@/lib/api/auth';
import { ApiError, jsonError, jsonOk } from '@/lib/api/http';
import { getWarehouseReceiptSequenceGap } from '@/lib/freight/services/warehouse-receipts';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    await requireUser(request);
    const url = new URL(request.url);
    const receiptNo = url.searchParams.get('receiptNo')?.trim() ?? '';

    if (receiptNo.length === 0) {
      throw new ApiError({
        status: 400,
        code: 'RECEIPT_NO_REQUIRED',
        message: 'Receipt number is required',
      });
    }

    const gap = await getWarehouseReceiptSequenceGap(receiptNo);
    return jsonOk({
      data: {
        hasGap: gap !== null,
        gap,
      },
    });
  } catch (error) {
    return jsonError(error as Error);
  }
}
