import { getDb } from '@/db/index';
import {
  houseBillsOfLading,
  inventoryItems,
  masterBillsOfLading,
  parties,
  transportNodes,
  warehouseReceipts,
  warehouses,
} from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { ApiError, jsonError, parseJson } from '@/lib/api/http';
import { isMissingMasterBillOfLadingColumnError } from '@/lib/freight/db-compat';
import { uuidSchema } from '@/lib/freight/schemas';
import {
  type WarehouseReceiptExportInput,
  buildWarehouseReceiptExportRows,
  createWarehouseReceiptExportWorkbook,
} from '@/lib/freight/warehouse-receipt-export';
import { eq, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { z } from 'zod';

export const runtime = 'nodejs';

const exportWarehouseReceiptsSchema = z.object({
  ids: z.array(uuidSchema).min(1),
});

export async function POST(request: Request) {
  try {
    await requireUser(request);
    const body = await parseJson(request, exportWarehouseReceiptsSchema);
    const receiptIds = Array.from(new Set(body.ids));

    const db = await getDb();
    const shippers = alias(parties, 'shippers');
    const mblDestinationNodes = alias(transportNodes, 'mbl_destination_nodes');

    const loadReceipts = async (includeNewColumns: boolean) => {
      return db
        .select({
          id: warehouseReceipts.id,
          receiptNo: warehouseReceipts.receiptNo,
          remarks: warehouseReceipts.remarks,
          internalRemarks: warehouseReceipts.internalRemarks,
          transportType: warehouseReceipts.transportType,
          customsDeclarationType: warehouseReceipts.customsDeclarationType,
          status: warehouseReceipts.status,
          inboundTime: warehouseReceipts.inboundTime,
          customerName: parties.name,
          shipperName: shippers.name,
          warehouseName: warehouses.name,
          hblNo: houseBillsOfLading.hblNo,
          ...(includeNewColumns
            ? {
                mblPortOfDestinationAddress:
                  masterBillsOfLading.portOfDestinationAddress,
              }
            : {}),
          mblPortOfDestinationNameCn: mblDestinationNodes.nameCn,
          mblPortOfDestinationNameEn: mblDestinationNodes.nameEn,
        })
        .from(warehouseReceipts)
        .leftJoin(parties, eq(warehouseReceipts.customerId, parties.id))
        .leftJoin(shippers, eq(warehouseReceipts.shipperId, shippers.id))
        .leftJoin(warehouses, eq(warehouseReceipts.warehouseId, warehouses.id))
        .leftJoin(
          houseBillsOfLading,
          eq(houseBillsOfLading.receiptId, warehouseReceipts.id)
        )
        .leftJoin(
          masterBillsOfLading,
          eq(masterBillsOfLading.receiptId, warehouseReceipts.id)
        )
        .leftJoin(
          mblDestinationNodes,
          eq(masterBillsOfLading.portOfDestinationId, mblDestinationNodes.id)
        )
        .where(inArray(warehouseReceipts.id, receiptIds));
    };

    let receipts: Array<
      Awaited<ReturnType<typeof loadReceipts>>[number] & {
        mblPortOfDestinationAddress?: string | null;
      }
    >;
    try {
      receipts = await loadReceipts(true);
    } catch (error) {
      if (!isMissingMasterBillOfLadingColumnError(error)) {
        throw error;
      }
      receipts = (await loadReceipts(false)).map((receipt) => ({
        ...receipt,
        mblPortOfDestinationAddress: null,
      }));
    }

    const receiptById = new Map(
      receipts.map((receipt) => [receipt.id, receipt])
    );
    const missingIds = receiptIds.filter((id) => !receiptById.has(id));
    const invalidStatusReceipts = receipts.filter(
      (receipt) => receipt.status !== 'INBOUND'
    );

    if (missingIds.length > 0 || invalidStatusReceipts.length > 0) {
      throw new ApiError({
        status: 400,
        code: 'EXPORT_RECEIPTS_NOT_AVAILABLE',
        message: 'Only existing inbound inventory receipts can be exported',
        details: {
          missingIds,
          invalidReceiptNos: invalidStatusReceipts.map(
            (receipt) => receipt.receiptNo
          ),
        },
      });
    }

    const items = await db
      .select({
        receiptId: inventoryItems.receiptId,
        commodityName: inventoryItems.commodityName,
        currentQty: inventoryItems.currentQty,
        unit: inventoryItems.unit,
        weightPerUnit: inventoryItems.weightPerUnit,
        lengthCm: inventoryItems.lengthCm,
        widthCm: inventoryItems.widthCm,
        heightCm: inventoryItems.heightCm,
      })
      .from(inventoryItems)
      .where(inArray(inventoryItems.receiptId, receiptIds));

    type ExportItemRow = (typeof items)[number];
    const itemsByReceiptId = new Map<string, ExportItemRow[]>();
    for (const item of items) {
      const current = itemsByReceiptId.get(item.receiptId) ?? [];
      current.push(item);
      itemsByReceiptId.set(item.receiptId, current);
    }

    const exportInput: WarehouseReceiptExportInput[] = receiptIds.map((id) => {
      const receipt = receiptById.get(id);
      if (!receipt) {
        throw new ApiError({
          status: 400,
          code: 'EXPORT_RECEIPTS_NOT_AVAILABLE',
          message: 'Only existing inbound inventory receipts can be exported',
        });
      }
      return {
        ...receipt,
        mblPortOfDestinationAddress:
          receipt.mblPortOfDestinationAddress ?? null,
        items: itemsByReceiptId.get(id) ?? [],
      };
    });

    const rows = buildWarehouseReceiptExportRows(exportInput);
    const workbook = createWarehouseReceiptExportWorkbook(rows);
    const fileName = `warehouse-receipts-${formatDateForFileName(new Date())}.xlsx`;

    return new Response(workbook, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': String(workbook.length),
      },
    });
  } catch (error) {
    return jsonError(error as Error);
  }
}

function formatDateForFileName(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}${month}${day}-${hour}${minute}`;
}
