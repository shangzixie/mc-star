import { getDb } from '@/db/index';
import { warehouseReceiptFees } from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { ApiError, jsonError, jsonOk, parseJson } from '@/lib/api/http';
import {
  uuidSchema,
  warehouseReceiptFeeUpdateSchema,
} from '@/lib/freight/schemas';
import { and, eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; feeId: string }> }
) {
  try {
    await requireUser(request);
    const { id, feeId } = await context.params;
    const receiptId = uuidSchema.parse(id);
    const idParsed = uuidSchema.parse(feeId);
    const body = await parseJson(request, warehouseReceiptFeeUpdateSchema);

    const db = await getDb();
    const [updated] = await db
      .update(warehouseReceiptFees)
      .set({
        feeType: body.feeType,
        feeName: body.feeName,
        unit: body.unit,
        currency: body.currency,
        price: body.price != null ? `${body.price}` : null,
        quantity: body.quantity != null ? `${body.quantity}` : null,
        originalAmount:
          body.originalAmount != null ? `${body.originalAmount}` : null,
        settledCurrency: body.settledCurrency,
        exchangeRate: body.exchangeRate != null ? `${body.exchangeRate}` : null,
        settledAmount:
          body.settledAmount != null ? `${body.settledAmount}` : null,
        paymentMethod: body.paymentMethod,
        partyId: body.partyId ?? null,
        remarks: body.remarks,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(warehouseReceiptFees.id, idParsed),
          eq(warehouseReceiptFees.receiptId, receiptId)
        )
      )
      .returning();

    if (!updated) {
      throw new ApiError({
        status: 404,
        code: 'WAREHOUSE_RECEIPT_FEE_NOT_FOUND',
        message: 'Warehouse receipt fee not found',
      });
    }

    return jsonOk({ data: updated });
  } catch (error) {
    return jsonError(error as Error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; feeId: string }> }
) {
  try {
    await requireUser(request);
    const { id, feeId } = await context.params;
    const receiptId = uuidSchema.parse(id);
    const idParsed = uuidSchema.parse(feeId);

    const db = await getDb();
    const [deleted] = await db
      .delete(warehouseReceiptFees)
      .where(
        and(
          eq(warehouseReceiptFees.id, idParsed),
          eq(warehouseReceiptFees.receiptId, receiptId)
        )
      )
      .returning();

    if (!deleted) {
      throw new ApiError({
        status: 404,
        code: 'WAREHOUSE_RECEIPT_FEE_NOT_FOUND',
        message: 'Warehouse receipt fee not found',
      });
    }

    return jsonOk({ data: { success: true } });
  } catch (error) {
    return jsonError(error as Error);
  }
}
