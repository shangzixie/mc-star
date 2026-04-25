import { getDb } from '@/db/index';
import {
  inventoryItems,
  parties,
  warehouseReceiptMerges,
  warehouseReceipts,
  warehouses,
} from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { jsonError, jsonOk, parseJson } from '@/lib/api/http';
import { isMissingWarehouseReceiptColumnError } from '@/lib/freight/db-compat';
import {
  createWarehouseReceiptSchema,
  uuidSchema,
} from '@/lib/freight/schemas';
import { createWarehouseReceipt } from '@/lib/freight/services/warehouse-receipts';
import { and, asc, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';

export const runtime = 'nodejs';

const freightDebugTimings =
  process.env.FREIGHT_API_DEBUG === '1' ||
  process.env.NEXT_PUBLIC_FREIGHT_API_DEBUG === '1';

function createServerRequestId(provided?: string) {
  if (provided && provided.length > 0) return provided;
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`
  );
}

function logServerTiming(requestId: string, message: string) {
  if (!freightDebugTimings) return;
  console.info(`[freight:${requestId}] ${message}`);
}

export async function GET(request: Request) {
  const requestId = createServerRequestId(
    request.headers.get('x-freight-request-id') ?? undefined
  );
  const overallStart = Date.now();
  let authDuration = 0;
  let queryBuildDuration = 0;
  let dbDuration = 0;

  try {
    const authStart = Date.now();
    await requireUser(request);
    authDuration = Date.now() - authStart;

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

    const queryBuildStart = Date.now();

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
            ilike(parties.name, `%${q}%`),
            ilike(parties.code, `%${q}%`)
          )
        : undefined,
    ].filter(Boolean);

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

    const buildOrderedQuery = (includeNewColumns: boolean) => {
      const baseQuery = db
        .select({
          id: warehouseReceipts.id,
          receiptNo: warehouseReceipts.receiptNo,
          warehouseId: warehouseReceipts.warehouseId,
          customerId: warehouseReceipts.customerId,
          transportType: warehouseReceipts.transportType,
          customsDeclarationType: warehouseReceipts.customsDeclarationType,
          status: warehouseReceipts.status,
          auditStatus: warehouseReceipts.auditStatus,
          inboundTime: warehouseReceipts.inboundTime,
          remarks: warehouseReceipts.remarks,
          internalRemarks: warehouseReceipts.internalRemarks,
          shipperId: warehouseReceipts.shipperId,
          ...(includeNewColumns
            ? {
                customerPhone: warehouseReceipts.customerPhone,
                shipperPhone: warehouseReceipts.shipperPhone,
                bookingAgentPhone: warehouseReceipts.bookingAgentPhone,
                customsAgentPhone: warehouseReceipts.customsAgentPhone,
                airType: warehouseReceipts.airType,
                courierTrackingNo: warehouseReceipts.courierTrackingNo,
                courierReceivedAt: warehouseReceipts.courierReceivedAt,
              }
            : {}),
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
          singleBillCutoffDateSi: warehouseReceipts.singleBillCutoffDateSi,
          singleBillGateClosingTime: warehouseReceipts.singleBillGateClosingTime,
          singleBillDepartureDateE: warehouseReceipts.singleBillDepartureDateE,
          singleBillArrivalDateE: warehouseReceipts.singleBillArrivalDateE,
          singleBillTransitDateE: warehouseReceipts.singleBillTransitDateE,
          singleBillDeliveryDateE: warehouseReceipts.singleBillDeliveryDateE,
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
            name: parties.name,
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
          isMergedParent: sql<boolean>`exists(select 1 from ${warehouseReceiptMerges} where ${warehouseReceiptMerges.parentReceiptId} = ${warehouseReceipts.id})`,
          isMergedChild: sql<boolean>`exists(select 1 from ${warehouseReceiptMerges} where ${warehouseReceiptMerges.childReceiptId} = ${warehouseReceipts.id})`,
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

      return queryWithStats.orderBy(
        sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn)
      );
    };
    queryBuildDuration = Date.now() - queryBuildStart;

    const dbStart = Date.now();
    const executeRowsQuery = async (includeNewColumns: boolean) => {
      const query = buildOrderedQuery(includeNewColumns);
      return conditions.length > 0 ? query.where(and(...conditions)) : query;
    };

    let rows: Awaited<ReturnType<typeof executeRowsQuery>>;
    try {
      rows = await executeRowsQuery(true);
    } catch (error) {
      if (!isMissingWarehouseReceiptColumnError(error)) {
        throw error;
      }
      rows = await executeRowsQuery(false);
    }
    dbDuration = Date.now() - dbStart;

    const totalDuration = Date.now() - overallStart;
    logServerTiming(
      requestId,
      `GET /api/freight/warehouse-receipts includeStats=${includeStats} includeItemNames=${includeItemNames} conditions=${conditions.length} rows=${rows.length} timings auth=${authDuration}ms query=${queryBuildDuration}ms db=${dbDuration}ms total=${totalDuration}ms`
    );

    return jsonOk({ data: rows });
  } catch (error) {
    logServerTiming(
      requestId,
      `GET /api/freight/warehouse-receipts failed (${error instanceof Error ? error.message : 'unknown'})`
    );
    return jsonError(error as Error);
  }
}

export async function POST(request: Request) {
  try {
    await requireUser(request);
    const body = await parseJson(request, createWarehouseReceiptSchema);
    const created = await createWarehouseReceipt(body);

    return jsonOk({ data: created }, { status: 201 });
  } catch (error) {
    return jsonError(error as Error);
  }
}
