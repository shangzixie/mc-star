import { z } from 'zod';
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
    weightTotal: z.string().nullable(),
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
    nameCn: z.string(),
    nameEn: z.string().nullable(),
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
    status: z.string(),
    inboundTime: isoDateTimeSchema.nullable(),
    remarks: z.string().nullable(),
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
