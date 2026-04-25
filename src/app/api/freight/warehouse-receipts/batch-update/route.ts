import { getDb } from '@/db/index';
import { requireUser } from '@/lib/api/auth';
import { jsonError, jsonOk, parseJson } from '@/lib/api/http';
import { batchUpdateWarehouseReceiptsSchema } from '@/lib/freight/schemas';
import {
  buildBatchWarehouseReceiptUpdateBody,
  runBatchWarehouseReceiptUpdate,
  updateWarehouseReceiptRecord,
} from '@/lib/freight/services/warehouse-receipts';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await parseJson(request, batchUpdateWarehouseReceiptsSchema);
    const db = await getDb();
    const payload = buildBatchWarehouseReceiptUpdateBody(body);

    const result = await runBatchWarehouseReceiptUpdate({
      ids: body.ids,
      payload,
      updateOne: async (receiptId, nextPayload) =>
        db.transaction((tx) =>
          updateWarehouseReceiptRecord(tx, {
            receiptId,
            body: nextPayload,
            userId: user.id,
          })
        ),
    });

    return jsonOk({ data: result });
  } catch (error) {
    return jsonError(error as Error);
  }
}
