import { z } from 'zod';
import {
  ALLOCATION_STATUSES,
  LOCATION_TYPES,
  RECEIPT_STATUSES,
  SHIPMENT_STATUSES,
  TRANSPORT_MODES,
} from './constants';

export const uuidSchema = z.string().uuid();

export const createPartySchema = z.object({
  code: z.string().max(50).optional(),
  nameCn: z.string().min(1),
  nameEn: z.string().optional(),
  roles: z.array(z.string().min(1).max(20)).min(1),
  taxNo: z.string().max(50).optional(),
  contactInfo: z.unknown().optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const createLocationSchema = z.object({
  unLocode: z.string().length(5).optional(),
  nameCn: z.string().min(1),
  nameEn: z.string().optional(),
  countryCode: z.string().length(2).optional(),
  type: z.enum(LOCATION_TYPES).optional(),
});

export const createWarehouseSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  contactPerson: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  metadata: z.unknown().optional(),
  remarks: z.string().optional(),
});

export const createWarehouseReceiptSchema = z.object({
  receiptNo: z.string().min(1).max(30),
  warehouseId: uuidSchema.optional(),
  customerId: uuidSchema.optional(),
  status: z.enum(RECEIPT_STATUSES).optional(),
  inboundTime: z.string().datetime().optional(),
  remarks: z.string().optional(),
});

export const addInventoryItemSchema = z.object({
  receiptId: uuidSchema,
  commodityName: z.string().optional(),
  skuCode: z.string().max(50).optional(),
  initialQty: z.number().int().positive(),
  unit: z.string().max(10).optional(),
  binLocation: z.string().max(50).optional(),
  weightTotal: z.number().optional(),
  lengthCm: z.number().optional(),
  widthCm: z.number().optional(),
  heightCm: z.number().optional(),
});

export const createShipmentSchema = z.object({
  jobNo: z.string().min(1).max(30),
  mblNo: z.string().max(50).optional(),
  hblNo: z.string().max(50).optional(),
  clientId: uuidSchema.optional(),
  shipperId: uuidSchema.optional(),
  consigneeId: uuidSchema.optional(),
  agentId: uuidSchema.optional(),
  carrierId: uuidSchema.optional(),
  polId: uuidSchema.optional(),
  podId: uuidSchema.optional(),
  transportMode: z.enum(TRANSPORT_MODES).optional(),
  status: z.enum(SHIPMENT_STATUSES).optional(),
  etd: z.string().datetime().optional(),
  eta: z.string().datetime().optional(),
  remarks: z.string().optional(),
  extraData: z.unknown().optional(),
});

export const createContainerSchema = z.object({
  shipmentId: uuidSchema,
  containerNo: z.string().max(11).optional(),
  containerType: z.string().max(10).optional(),
  sealNo: z.string().max(50).optional(),
  vgmWeight: z.number().optional(),
  tareWeight: z.number().optional(),
});

export const createAllocationSchema = z.object({
  inventoryItemId: uuidSchema,
  shipmentId: uuidSchema,
  containerId: uuidSchema.optional(),
  allocatedQty: z.number().int().positive(),
});

export const pickAllocationSchema = z.object({
  pickedQty: z.number().int().nonnegative(),
});

export const loadAllocationSchema = z.object({
  loadedQty: z.number().int().nonnegative(),
  containerId: uuidSchema.optional(),
});

export const shipAllocationSchema = z.object({
  shippedQty: z.number().int().positive(),
});

export const splitAllocationSchema = z.object({
  splitQty: z.number().int().positive(),
  newContainerId: uuidSchema.optional(),
});

export const createAttachmentSchema = z.object({
  shipmentId: uuidSchema,
  fileName: z.string().min(1),
  fileType: z.string().max(50).optional(),
  fileUrl: z.string().url(),
  fileSize: z.number().int().positive().optional(),
});

export const allocationStatusSchema = z.enum(ALLOCATION_STATUSES);
