import { getDb } from '@/db/index';
import { parties, warehouseReceipts, warehouses } from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { jsonError, jsonOk, parseJson } from '@/lib/api/http';
import {
  createWarehouseReceiptSchema,
  uuidSchema,
} from '@/lib/freight/schemas';
import { and, asc, desc, eq, gte, ilike, lte, or } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    await requireUser(request);
    const url = new URL(request.url);
    const warehouseId = url.searchParams.get('warehouseId');
    const customerId = url.searchParams.get('customerId');
    const status = url.searchParams.get('status');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    const q = url.searchParams.get('q')?.trim();

    const db = await getDb();

    // Build conditions
    const conditions = [
      warehouseId
        ? eq(warehouseReceipts.warehouseId, uuidSchema.parse(warehouseId))
        : undefined,
      customerId
        ? eq(warehouseReceipts.customerId, uuidSchema.parse(customerId))
        : undefined,
      status ? eq(warehouseReceipts.status, status) : undefined,
      dateFrom
        ? gte(warehouseReceipts.inboundTime, new Date(dateFrom))
        : undefined,
      dateTo ? lte(warehouseReceipts.inboundTime, new Date(dateTo)) : undefined,
      q && q.length > 0
        ? or(
            ilike(warehouseReceipts.receiptNo, `%${q}%`),
            ilike(warehouseReceipts.remarks, `%${q}%`),
            // allow searching warehouse / customer names
            ilike(warehouses.name, `%${q}%`),
            ilike(parties.nameCn, `%${q}%`),
            ilike(parties.nameEn, `%${q}%`),
            ilike(parties.code, `%${q}%`)
          )
        : undefined,
    ].filter(Boolean);

    // Determine sort column
    const sortColumn =
      sortBy === 'receiptNo'
        ? warehouseReceipts.receiptNo
        : sortBy === 'inboundTime'
          ? warehouseReceipts.inboundTime
          : warehouseReceipts.createdAt;

    // Build query with joins
    const baseQuery = db
      .select({
        id: warehouseReceipts.id,
        receiptNo: warehouseReceipts.receiptNo,
        warehouseId: warehouseReceipts.warehouseId,
        customerId: warehouseReceipts.customerId,
        status: warehouseReceipts.status,
        inboundTime: warehouseReceipts.inboundTime,
        remarks: warehouseReceipts.remarks,
        createdAt: warehouseReceipts.createdAt,
        warehouse: {
          id: warehouses.id,
          name: warehouses.name,
          address: warehouses.address,
          contactPerson: warehouses.contactPerson,
          phone: warehouses.phone,
          metadata: warehouses.metadata,
          remarks: warehouses.remarks,
          isActive: warehouses.isActive,
          createdAt: warehouses.createdAt,
          updatedAt: warehouses.updatedAt,
        },
        customer: {
          id: parties.id,
          code: parties.code,
          nameCn: parties.nameCn,
          nameEn: parties.nameEn,
          roles: parties.roles,
          taxNo: parties.taxNo,
          contactInfo: parties.contactInfo,
          address: parties.address,
          remarks: parties.remarks,
          isActive: parties.isActive,
          createdAt: parties.createdAt,
          updatedAt: parties.updatedAt,
        },
      })
      .from(warehouseReceipts)
      .leftJoin(warehouses, eq(warehouseReceipts.warehouseId, warehouses.id))
      .leftJoin(parties, eq(warehouseReceipts.customerId, parties.id))
      .orderBy(sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn));

    const rows =
      conditions.length > 0
        ? await baseQuery.where(and(...conditions))
        : await baseQuery;

    return jsonOk({ data: rows });
  } catch (error) {
    return jsonError(error as Error);
  }
}

export async function POST(request: Request) {
  try {
    await requireUser(request);
    const body = await parseJson(request, createWarehouseReceiptSchema);
    const db = await getDb();

    const [created] = await db
      .insert(warehouseReceipts)
      .values({
        receiptNo: body.receiptNo,
        warehouseId: body.warehouseId,
        customerId: body.customerId,
        status: body.status ?? 'RECEIVED',
        inboundTime: body.inboundTime ? new Date(body.inboundTime) : undefined,
        remarks: body.remarks,
      })
      .returning();

    return jsonOk({ data: created }, { status: 201 });
  } catch (error) {
    return jsonError(error as Error);
  }
}
