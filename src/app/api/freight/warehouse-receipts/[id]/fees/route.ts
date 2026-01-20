import { getDb } from '@/db/index';
import { parties, warehouseReceiptFees } from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { jsonError, jsonOk, parseJson } from '@/lib/api/http';
import {
  uuidSchema,
  warehouseReceiptFeeCreateSchema,
} from '@/lib/freight/schemas';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

export const runtime = 'nodejs';

const listQuerySchema = z.object({
  feeType: z.enum(['AR', 'AP']).optional(),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(request);
    const { id } = await context.params;
    const receiptId = uuidSchema.parse(id);

    const url = new URL(request.url);
    const query = listQuerySchema.parse({
      feeType: url.searchParams.get('feeType') ?? undefined,
    });

    const db = await getDb();
    const where = [eq(warehouseReceiptFees.receiptId, receiptId)];
    if (query.feeType) {
      where.push(eq(warehouseReceiptFees.feeType, query.feeType));
    }

    const rows = await db
      .select({
        id: warehouseReceiptFees.id,
        receiptId: warehouseReceiptFees.receiptId,
        feeType: warehouseReceiptFees.feeType,
        feeName: warehouseReceiptFees.feeName,
        unit: warehouseReceiptFees.unit,
        currency: warehouseReceiptFees.currency,
        price: warehouseReceiptFees.price,
        quantity: warehouseReceiptFees.quantity,
        originalAmount: warehouseReceiptFees.originalAmount,
        settledCurrency: warehouseReceiptFees.settledCurrency,
        exchangeRate: warehouseReceiptFees.exchangeRate,
        settledAmount: warehouseReceiptFees.settledAmount,
        paymentMethod: warehouseReceiptFees.paymentMethod,
        partyId: warehouseReceiptFees.partyId,
        remarks: warehouseReceiptFees.remarks,
        createdAt: warehouseReceiptFees.createdAt,
        updatedAt: warehouseReceiptFees.updatedAt,
        party: {
          id: parties.id,
          code: parties.code,
          name: parties.name,
        },
      })
      .from(warehouseReceiptFees)
      .leftJoin(parties, eq(warehouseReceiptFees.partyId, parties.id))
      .where(and(...where))
      .orderBy(desc(warehouseReceiptFees.createdAt));

    return jsonOk({ data: rows });
  } catch (error) {
    return jsonError(error as Error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(request);
    const { id } = await context.params;
    const receiptId = uuidSchema.parse(id);
    const body = await parseJson(request, warehouseReceiptFeeCreateSchema);

    const db = await getDb();
    const [created] = await db
      .insert(warehouseReceiptFees)
      .values({
        receiptId,
        feeType: body.feeType,
        feeName: body.feeName,
        unit: body.unit,
        currency: body.currency,
        price: body.price != null ? `${body.price}` : undefined,
        quantity: body.quantity != null ? `${body.quantity}` : undefined,
        originalAmount:
          body.originalAmount != null ? `${body.originalAmount}` : undefined,
        settledCurrency: body.settledCurrency,
        exchangeRate:
          body.exchangeRate != null ? `${body.exchangeRate}` : undefined,
        settledAmount:
          body.settledAmount != null ? `${body.settledAmount}` : undefined,
        paymentMethod: body.paymentMethod,
        partyId: body.partyId ?? null,
        remarks: body.remarks,
        updatedAt: new Date(),
      })
      .returning();

    return jsonOk({ data: created }, { status: 201 });
  } catch (error) {
    return jsonError(error as Error);
  }
}
