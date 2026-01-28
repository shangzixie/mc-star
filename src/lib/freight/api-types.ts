import { z } from 'zod';
import {
  AUDIT_STATUSES,
  WAREHOUSE_RECEIPT_CUSTOMS_DECLARATION_TYPES,
  WAREHOUSE_RECEIPT_TRANSPORT_TYPES,
} from './constants';
import { uuidSchema } from './schemas';

// -----------------------------------------------------------------------------
// API envelope
// -----------------------------------------------------------------------------

export const apiErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export type ApiErrorEnvelope = z.infer<typeof apiErrorEnvelopeSchema>;

export const apiOkEnvelopeSchema = <TData extends z.ZodTypeAny>(data: TData) =>
  z.object({
    data,
  });

// -----------------------------------------------------------------------------
// Domain models (as returned by Route Handlers JSON)
//
// Notes:
// - `timestamp` columns are serialized to ISO strings in JSON responses.
// - `numeric` columns commonly come back as strings with postgres-js.
// -----------------------------------------------------------------------------

const isoDateTimeSchema = z.string().datetime();

export const freightShipmentSchema = z
  .object({
    id: uuidSchema,
    jobNo: z.string(),
    mblNo: z.string().nullable(),
    hblNo: z.string().nullable(),
    clientId: uuidSchema.nullable(),
    shipperId: uuidSchema.nullable(),
    consigneeId: uuidSchema.nullable(),
    agentId: uuidSchema.nullable(),
    carrierId: uuidSchema.nullable(),
    polId: uuidSchema.nullable(),
    podId: uuidSchema.nullable(),
    transportMode: z.string(),
    status: z.string(),
    etd: isoDateTimeSchema.nullable(),
    eta: isoDateTimeSchema.nullable(),
    remarks: z.string().nullable(),
    extraData: z.unknown(),
    createdAt: isoDateTimeSchema.nullable(),
    updatedAt: isoDateTimeSchema.nullable(),
  })
  .passthrough();

export type FreightShipment = z.infer<typeof freightShipmentSchema>;

export const freightContainerSchema = z
  .object({
    id: uuidSchema,
    shipmentId: uuidSchema,
    containerNo: z.string().nullable(),
    containerType: z.string().nullable(),
    sealNo: z.string().nullable(),
    vgmWeight: z.string().nullable(),
    tareWeight: z.string().nullable(),
    createdAt: isoDateTimeSchema.nullable(),
  })
  .passthrough();

export type FreightContainer = z.infer<typeof freightContainerSchema>;

export const freightAllocationSchema = z
  .object({
    id: uuidSchema,
    inventoryItemId: uuidSchema,
    shipmentId: uuidSchema,
    containerId: uuidSchema.nullable(),
    allocatedQty: z.number().int(),
    pickedQty: z.number().int(),
    loadedQty: z.number().int(),
    shippedQty: z.number().int(),
    status: z.string(),
    createdAt: isoDateTimeSchema.nullable(),
  })
  .passthrough();

export type FreightAllocation = z.infer<typeof freightAllocationSchema>;

export const freightInventoryItemSchema = z
  .object({
    id: uuidSchema,
    receiptId: uuidSchema,
    commodityName: z.string().nullable(),
    skuCode: z.string().nullable(),
    initialQty: z.number().int(),
    currentQty: z.number().int(),
    unit: z.string().nullable(),
    binLocation: z.string().nullable(),
    weightPerUnit: z.string().nullable(),
    lengthCm: z.string().nullable(),
    widthCm: z.string().nullable(),
    heightCm: z.string().nullable(),
    createdAt: isoDateTimeSchema.nullable(),
  })
  .passthrough();

export type FreightInventoryItem = z.infer<typeof freightInventoryItemSchema>;

export const freightPartySchema = z
  .object({
    id: uuidSchema,
    code: z.string().nullable(),
    name: z.string(),
    roles: z.array(z.string()),
    taxNo: z.string().nullable(),
    contactInfo: z.unknown(),
    address: z.string().nullable(),
    remarks: z.string().nullable(),
    isActive: z.boolean(),
    createdAt: isoDateTimeSchema.nullable(),
    updatedAt: isoDateTimeSchema.nullable(),
  })
  .passthrough();

export type FreightParty = z.infer<typeof freightPartySchema>;

export const freightWarehouseReceiptFeeSchema = z
  .object({
    id: uuidSchema,
    receiptId: uuidSchema,
    feeType: z.string(),
    feeName: z.string(),
    unit: z.string().nullable(),
    currency: z.string().nullable(),
    price: z.string().nullable(),
    quantity: z.string().nullable(),
    originalAmount: z.string().nullable(),
    settledCurrency: z.string().nullable(),
    exchangeRate: z.string().nullable(),
    settledAmount: z.string().nullable(),
    paymentMethod: z.string().nullable(),
    partyId: uuidSchema.nullable(),
    remarks: z.string().nullable(),
    createdAt: isoDateTimeSchema.nullable(),
    updatedAt: isoDateTimeSchema.nullable(),
    party: z
      .object({
        id: uuidSchema.nullable(),
        code: z.string().nullable(),
        name: z.string().nullable(),
      })
      .optional(),
  })
  .passthrough();

export type FreightWarehouseReceiptFee = z.infer<
  typeof freightWarehouseReceiptFeeSchema
>;

export const freightWarehouseSchema = z
  .object({
    id: uuidSchema,
    name: z.string(),
    address: z.string().nullable(),
    contactPerson: z.string().nullable(),
    phone: z.string().nullable(),
    metadata: z.unknown(),
    remarks: z.string().nullable(),
    isActive: z.boolean().optional(),
    createdAt: isoDateTimeSchema.nullable(),
    updatedAt: isoDateTimeSchema.nullable().optional(),
  })
  .passthrough();

export type FreightWarehouse = z.infer<typeof freightWarehouseSchema>;

export const freightWarehouseReceiptSchema = z
  .object({
    id: uuidSchema,
    receiptNo: z.string(),
    warehouseId: uuidSchema.nullable(),
    customerId: uuidSchema.nullable(),
    transportType: z.enum(WAREHOUSE_RECEIPT_TRANSPORT_TYPES).nullable(),
    customsDeclarationType: z
      .enum(WAREHOUSE_RECEIPT_CUSTOMS_DECLARATION_TYPES)
      .nullable(),
    status: z.string(),
    auditStatus: z.enum(AUDIT_STATUSES).nullable(),
    inboundTime: isoDateTimeSchema.nullable(),
    remarks: z.string().nullable(),
    internalRemarks: z.string().nullable(),
    manualPieces: z.string().nullable().optional(),
    manualWeightKg: z.string().nullable().optional(),
    manualVolumeM3: z.string().nullable().optional(),
    bubbleSplitPercent: z.string().nullable().optional(),
    weightConversionFactor: z.string().nullable().optional(),
    // Contact information
    shipperId: uuidSchema.nullable().optional(),
    bookingAgentId: uuidSchema.nullable().optional(),
    customsAgentId: uuidSchema.nullable().optional(),
    // Employee assignments
    salesEmployeeId: uuidSchema.nullable().optional(),
    customerServiceEmployeeId: uuidSchema.nullable().optional(),
    overseasCsEmployeeId: uuidSchema.nullable().optional(),
    operationsEmployeeId: uuidSchema.nullable().optional(),
    documentationEmployeeId: uuidSchema.nullable().optional(),
    financeEmployeeId: uuidSchema.nullable().optional(),
    bookingEmployeeId: uuidSchema.nullable().optional(),
    reviewerEmployeeId: uuidSchema.nullable().optional(),
    // Transport schedule (yyyy-mm-dd)
    airCarrier: z.string().nullable().optional(),
    airFlightNo: z.string().nullable().optional(),
    airFlightDate: z.string().nullable().optional(),
    airArrivalDateE: z.string().nullable().optional(),
    airOperationLocation: z.string().nullable().optional(),
    airOperationNode: z.string().nullable().optional(),
    seaCarrier: z.string().nullable().optional(),
    seaRoute: z.string().nullable().optional(),
    seaVesselName: z.string().nullable().optional(),
    seaVoyage: z.string().nullable().optional(),
    seaEtdE: z.string().nullable().optional(),
    seaEtaE: z.string().nullable().optional(),
    singleBillCutoffDateSi: z.string().nullable().optional(),
    singleBillGateClosingTime: z.string().nullable().optional(),
    singleBillDepartureDateE: z.string().nullable().optional(),
    singleBillArrivalDateE: z.string().nullable().optional(),
    singleBillTransitDateE: z.string().nullable().optional(),
    singleBillDeliveryDateE: z.string().nullable().optional(),
    createdAt: isoDateTimeSchema.nullable(),
  })
  .passthrough();

export type FreightWarehouseReceipt = z.infer<
  typeof freightWarehouseReceiptSchema
>;

export const freightAttachmentSchema = z
  .object({
    id: uuidSchema,
    shipmentId: uuidSchema,
    fileName: z.string(),
    fileType: z.string().nullable(),
    fileUrl: z.string(),
    fileSize: z.number().int().nullable(),
    uploadedBy: uuidSchema.nullable(),
    createdAt: isoDateTimeSchema.nullable(),
  })
  .passthrough();

export type FreightAttachment = z.infer<typeof freightAttachmentSchema>;

// Inventory movement type
export const freightInventoryMovementSchema = z
  .object({
    id: uuidSchema,
    inventoryItemId: uuidSchema,
    refType: z.string(),
    refId: uuidSchema.nullable(),
    qtyDelta: z.number().int(),
    createdAt: isoDateTimeSchema.nullable(),
  })
  .passthrough();

export type FreightInventoryMovement = z.infer<
  typeof freightInventoryMovementSchema
>;

// Inventory item allocation view (joined)
export const freightInventoryItemAllocationViewSchema = z
  .object({
    id: uuidSchema,
    inventoryItemId: uuidSchema,
    shipmentId: uuidSchema,
    jobNo: z.string(),
    containerId: uuidSchema.nullable(),
    containerNo: z.string().nullable(),
    allocatedQty: z.number().int(),
    pickedQty: z.number().int(),
    loadedQty: z.number().int(),
    shippedQty: z.number().int(),
    status: z.string(),
    createdAt: isoDateTimeSchema.nullable(),
  })
  .passthrough();

export type FreightInventoryItemAllocationView = z.infer<
  typeof freightInventoryItemAllocationViewSchema
>;

// Extended types with relations and aggregations
export const freightWarehouseReceiptWithRelationsSchema =
  freightWarehouseReceiptSchema.extend({
    warehouse: freightWarehouseSchema.nullable().optional(),
    customer: freightPartySchema.nullable().optional(),
    commodityNames: z.string().nullable().optional(),
    isMergedParent: z.boolean().optional(),
    isMergedChild: z.boolean().optional(),
    mergedChildren: z
      .array(
        z.object({
          id: uuidSchema,
          receiptNo: z.string(),
        })
      )
      .optional(),
    mergedChildItems: z
      .array(
        z.object({
          receiptId: uuidSchema,
          receiptNo: z.string(),
          commodityNames: z.string().nullable(),
          totalInitialQty: z.number().int(),
          unit: z.string().nullable(),
        })
      )
      .optional(),
    stats: z
      .object({
        totalItems: z.number().int(),
        totalInitialQty: z.number().int(),
        totalCurrentQty: z.number().int(),
        totalWeight: z.string().nullable(),
        totalVolume: z.string().nullable(),
      })
      .optional(),
  });

export type FreightWarehouseReceiptWithRelations = z.infer<
  typeof freightWarehouseReceiptWithRelationsSchema
>;

export const freightInventoryItemWithAllocationsSchema =
  freightInventoryItemSchema.extend({
    allocations: z.array(freightAllocationSchema).optional(),
    totalAllocated: z.number().int().optional(),
    totalShipped: z.number().int().optional(),
  });

export type FreightInventoryItemWithAllocations = z.infer<
  typeof freightInventoryItemWithAllocationsSchema
>;

export const freightMasterBillOfLadingSchema = z
  .object({
    id: z.union([uuidSchema, z.string()]), // UUID or string (handles Drizzle's UUID conversion)
    receiptId: z.union([uuidSchema, z.string()]),
    mblNo: z.string().nullable().optional(),
    soNo: z.string().nullable().optional(),
    portOfDestinationId: z.union([uuidSchema, z.string(), z.null()]),
    portOfDischargeId: z.union([uuidSchema, z.string(), z.null()]),
    portOfLoadingId: z.union([uuidSchema, z.string(), z.null()]),
    placeOfReceiptId: z.union([uuidSchema, z.string(), z.null()]),
    createdAt: z.union([isoDateTimeSchema, z.string(), z.null()]), // Handle timestamp objects
    updatedAt: z.union([isoDateTimeSchema, z.string(), z.null()]),
  })
  .passthrough()
  .transform((data) => ({
    ...data,
    // Ensure all UUID/timestamp fields are serialized to strings
    id: String(data.id),
    receiptId: String(data.receiptId),
    mblNo: data.mblNo ?? null,
    soNo: data.soNo ?? null,
    portOfDestinationId: data.portOfDestinationId
      ? String(data.portOfDestinationId)
      : null,
    portOfDischargeId: data.portOfDischargeId
      ? String(data.portOfDischargeId)
      : null,
    portOfLoadingId: data.portOfLoadingId ? String(data.portOfLoadingId) : null,
    placeOfReceiptId: data.placeOfReceiptId
      ? String(data.placeOfReceiptId)
      : null,
    createdAt: data.createdAt ? String(data.createdAt) : null,
    updatedAt: data.updatedAt ? String(data.updatedAt) : null,
  }));

export type FreightMasterBillOfLading = z.infer<
  typeof freightMasterBillOfLadingSchema
>;

export const freightHouseBillOfLadingSchema = z
  .object({
    id: z.union([uuidSchema, z.string()]), // UUID or string (handles Drizzle's UUID conversion)
    receiptId: z.union([uuidSchema, z.string()]),
    hblNo: z.string().nullable().optional(),
    portOfDestinationId: z.union([uuidSchema, z.string(), z.null()]),
    portOfDischargeId: z.union([uuidSchema, z.string(), z.null()]),
    portOfLoadingId: z.union([uuidSchema, z.string(), z.null()]),
    placeOfReceiptId: z.union([uuidSchema, z.string(), z.null()]),
    createdAt: z.union([isoDateTimeSchema, z.string(), z.null()]), // Handle timestamp objects
    updatedAt: z.union([isoDateTimeSchema, z.string(), z.null()]),
  })
  .passthrough()
  .transform((data) => ({
    ...data,
    id: String(data.id),
    receiptId: String(data.receiptId),
    hblNo: data.hblNo ?? null,
    portOfDestinationId: data.portOfDestinationId
      ? String(data.portOfDestinationId)
      : null,
    portOfDischargeId: data.portOfDischargeId
      ? String(data.portOfDischargeId)
      : null,
    portOfLoadingId: data.portOfLoadingId ? String(data.portOfLoadingId) : null,
    placeOfReceiptId: data.placeOfReceiptId
      ? String(data.placeOfReceiptId)
      : null,
    createdAt: data.createdAt ? String(data.createdAt) : null,
    updatedAt: data.updatedAt ? String(data.updatedAt) : null,
  }));

export type FreightHouseBillOfLading = z.infer<
  typeof freightHouseBillOfLadingSchema
>;

export const transportNodeSchema = z
  .object({
    id: uuidSchema,
    unLocode: z.string().nullable(),
    nameCn: z.string(),
    nameEn: z.string().nullable(),
    countryCode: z.string().nullable(),
    type: z.string().nullable(),
    createdAt: isoDateTimeSchema.nullable(),
  })
  .passthrough();

export type TransportNode = z.infer<typeof transportNodeSchema>;
