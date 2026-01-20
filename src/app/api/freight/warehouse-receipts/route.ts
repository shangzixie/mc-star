import { getDb } from '@/db/index';
import {
  inventoryItems,
  parties,
  warehouseReceipts,
  warehouses,
} from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { jsonError, jsonOk, parseJson } from '@/lib/api/http';
import {
  createWarehouseReceiptSchema,
  uuidSchema,
} from '@/lib/freight/schemas';
import { and, asc, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    await requireUser(request);
    const url = new URL(request.url);
    const warehouseId = url.searchParams.get('warehouseId');
    const customerId = url.searchParams.get('customerId');
    const status = url.searchParams.get('status');
    const includeStats =
      url.searchParams.get('includeStats') === '1' ||
      url.searchParams.get('includeStats') === 'true';
    const includeItemNames =
      url.searchParams.get('includeItemNames') === '1' ||
      url.searchParams.get('includeItemNames') === 'true';
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
            ilike(warehouseReceipts.internalRemarks, `%${q}%`),
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

    const itemStatsSubquery = includeStats
      ? db
          .select({
            receiptId: inventoryItems.receiptId,
            totalItems: sql<number>`count(*)::int`.as('totalItems'),
            totalInitialQty:
              sql<number>`coalesce(sum(${inventoryItems.initialQty}), 0)::int`.as(
                'totalInitialQty'
              ),
            totalCurrentQty:
              sql<number>`coalesce(sum(${inventoryItems.currentQty}), 0)::int`.as(
                'totalCurrentQty'
              ),
            totalWeight:
              sql<string>`(ceiling(sum(coalesce(${inventoryItems.weightPerUnit}, 0) * ${inventoryItems.initialQty}) * 100) / 100)::text`.as(
                'totalWeight'
              ),
            totalVolume:
              sql<string>`(sum(ceiling(((coalesce(${inventoryItems.lengthCm}, 0) * coalesce(${inventoryItems.widthCm}, 0) * coalesce(${inventoryItems.heightCm}, 0)) / 1000000) * 100) * ${inventoryItems.initialQty}) / 100)::text`.as(
                'totalVolume'
              ),
          })
          .from(inventoryItems)
          .groupBy(inventoryItems.receiptId)
          .as('item_stats')
      : null;

    const itemNamesSubquery = includeItemNames
      ? db
          .select({
            receiptId: inventoryItems.receiptId,
            commodityNames:
              sql<string>`string_agg(nullif(trim(${inventoryItems.commodityName}), ''), '; ' ORDER BY ${inventoryItems.createdAt})`.as(
                'commodity_names'
              ),
          })
          .from(inventoryItems)
          .groupBy(inventoryItems.receiptId)
          .as('item_names')
      : null;

    // Build query with joins
    const baseQuery = db
      .select({
        id: warehouseReceipts.id,
        receiptNo: warehouseReceipts.receiptNo,
        warehouseId: warehouseReceipts.warehouseId,
        customerId: warehouseReceipts.customerId,
        transportType: warehouseReceipts.transportType,
        customsDeclarationType: warehouseReceipts.customsDeclarationType,
        status: warehouseReceipts.status,
        inboundTime: warehouseReceipts.inboundTime,
        remarks: warehouseReceipts.remarks,
        internalRemarks: warehouseReceipts.internalRemarks,
        shipperId: warehouseReceipts.shipperId,
        bookingAgentId: warehouseReceipts.bookingAgentId,
        customsAgentId: warehouseReceipts.customsAgentId,
        salesEmployeeId: warehouseReceipts.salesEmployeeId,
        customerServiceEmployeeId: warehouseReceipts.customerServiceEmployeeId,
        overseasCsEmployeeId: warehouseReceipts.overseasCsEmployeeId,
        operationsEmployeeId: warehouseReceipts.operationsEmployeeId,
        documentationEmployeeId: warehouseReceipts.documentationEmployeeId,
        financeEmployeeId: warehouseReceipts.financeEmployeeId,
        bookingEmployeeId: warehouseReceipts.bookingEmployeeId,
        reviewerEmployeeId: warehouseReceipts.reviewerEmployeeId,
        airCarrier: warehouseReceipts.airCarrier,
        airFlightNo: warehouseReceipts.airFlightNo,
        airFlightDate: warehouseReceipts.airFlightDate,
        airArrivalDateE: warehouseReceipts.airArrivalDateE,
        airOperationLocation: warehouseReceipts.airOperationLocation,
        airOperationNode: warehouseReceipts.airOperationNode,
        seaCarrier: warehouseReceipts.seaCarrier,
        seaRoute: warehouseReceipts.seaRoute,
        seaVesselName: warehouseReceipts.seaVesselName,
        seaVoyage: warehouseReceipts.seaVoyage,
        seaEtdE: warehouseReceipts.seaEtdE,
        seaEtaE: warehouseReceipts.seaEtaE,
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
        ...(includeItemNames
          ? { commodityNames: itemNamesSubquery!.commodityNames }
          : {}),
        ...(includeStats
          ? {
              stats: {
                totalItems: sql<number>`coalesce(${itemStatsSubquery!.totalItems}, 0)::int`,
                totalInitialQty: sql<number>`coalesce(${itemStatsSubquery!.totalInitialQty}, 0)::int`,
                totalCurrentQty: sql<number>`coalesce(${itemStatsSubquery!.totalCurrentQty}, 0)::int`,
                totalWeight: itemStatsSubquery!.totalWeight,
                totalVolume: itemStatsSubquery!.totalVolume,
              },
            }
          : {}),
      })
      .from(warehouseReceipts)
      .leftJoin(warehouses, eq(warehouseReceipts.warehouseId, warehouses.id))
      .leftJoin(parties, eq(warehouseReceipts.customerId, parties.id));

    const queryWithItemNames =
      includeItemNames && itemNamesSubquery
        ? baseQuery.leftJoin(
            itemNamesSubquery,
            eq(itemNamesSubquery.receiptId, warehouseReceipts.id)
          )
        : baseQuery;

    const queryWithStats =
      includeStats && itemStatsSubquery
        ? queryWithItemNames.leftJoin(
            itemStatsSubquery,
            eq(itemStatsSubquery.receiptId, warehouseReceipts.id)
          )
        : queryWithItemNames;

    const orderedQuery = queryWithStats.orderBy(
      sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn)
    );

    const rows =
      conditions.length > 0
        ? await orderedQuery.where(and(...conditions))
        : await orderedQuery;

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
        transportType: body.transportType,
        customsDeclarationType: body.customsDeclarationType,
        status: body.status ?? 'RECEIVED',
        inboundTime: body.inboundTime ? new Date(body.inboundTime) : undefined,
        remarks: body.remarks,
        internalRemarks: body.internalRemarks,
        shipperId: body.shipperId,
        bookingAgentId: body.bookingAgentId,
        customsAgentId: body.customsAgentId,
        salesEmployeeId: body.salesEmployeeId,
        customerServiceEmployeeId: body.customerServiceEmployeeId,
        overseasCsEmployeeId: body.overseasCsEmployeeId,
        operationsEmployeeId: body.operationsEmployeeId,
        documentationEmployeeId: body.documentationEmployeeId,
        financeEmployeeId: body.financeEmployeeId,
        bookingEmployeeId: body.bookingEmployeeId,
        reviewerEmployeeId: body.reviewerEmployeeId,
        airCarrier: body.airCarrier,
        airFlightNo: body.airFlightNo,
        airFlightDate: body.airFlightDate,
        airArrivalDateE: body.airArrivalDateE,
        airOperationLocation: body.airOperationLocation,
        airOperationNode: body.airOperationNode,
        seaCarrier: body.seaCarrier,
        seaRoute: body.seaRoute,
        seaVesselName: body.seaVesselName,
        seaVoyage: body.seaVoyage,
        seaEtdE: body.seaEtdE,
        seaEtaE: body.seaEtaE,
      })
      .returning();

    return jsonOk({ data: created }, { status: 201 });
  } catch (error) {
    return jsonError(error as Error);
  }
}
