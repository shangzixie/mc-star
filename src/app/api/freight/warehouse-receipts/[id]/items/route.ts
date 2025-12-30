import { getDb } from '@/db/index';
import { inventoryItems, inventoryMovements } from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { jsonError, jsonOk, parseJson } from '@/lib/api/http';
import { addInventoryItemSchema, uuidSchema } from '@/lib/freight/schemas';

export const runtime = 'nodejs';

const addItemToReceiptSchema = addInventoryItemSchema.omit({ receiptId: true });

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(request);
    const { id } = await context.params;
    const receiptId = uuidSchema.parse(id);
    const body = await parseJson(request, addItemToReceiptSchema);

    const db = await getDb();
    const result = await db.transaction(async (tx) => {
      const [createdItem] = await tx
        .insert(inventoryItems)
        .values({
          receiptId,
          commodityName: body.commodityName,
          skuCode: body.skuCode,
          initialQty: body.initialQty,
          currentQty: body.initialQty,
          unit: body.unit,
          binLocation: body.binLocation,
          weightPerUnit:
            body.weightPerUnit != null ? `${body.weightPerUnit}` : undefined,
          lengthCm: body.lengthCm != null ? `${body.lengthCm}` : undefined,
          widthCm: body.widthCm != null ? `${body.widthCm}` : undefined,
          heightCm: body.heightCm != null ? `${body.heightCm}` : undefined,
        })
        .returning();

      await tx.insert(inventoryMovements).values({
        inventoryItemId: createdItem.id,
        refType: 'RECEIPT',
        refId: receiptId,
        qtyDelta: body.initialQty,
      });

      return createdItem;
    });

    return jsonOk({ data: result }, { status: 201 });
  } catch (error) {
    return jsonError(error as Error);
  }
}
