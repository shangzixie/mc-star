export const LOCATION_TYPES = ['SEA', 'AIR', 'RAIL', 'ROAD'] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

export const TRANSPORT_MODES = ['SEA', 'AIR', 'RAIL'] as const;
export type TransportMode = (typeof TRANSPORT_MODES)[number];

export const SHIPMENT_STATUSES = [
  'DRAFT',
  'BOOKED',
  'SHIPPED',
  'ARRIVED',
  'CLOSED',
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const RECEIPT_STATUSES = ['RECEIVED', 'SHIPPED', 'PARTIAL'] as const;
export type ReceiptStatus = (typeof RECEIPT_STATUSES)[number];

export const WAREHOUSE_RECEIPT_TRANSPORT_TYPES = [
  'SEA_FCL',
  'AIR_FREIGHT',
  'SEA_LCL',
  'DOMESTIC_TRANSPORT',
  'WAREHOUSING',
  'ROAD_FTL',
  'ROAD_LTL',
  'EXPRESS_LINEHAUL',
  'FBA_SEA',
  'FBA_AIR',
  'FBA_RAIL',
  'BULK_CARGO',
  'RAIL_FREIGHT',
] as const;
export type WarehouseReceiptTransportType =
  (typeof WAREHOUSE_RECEIPT_TRANSPORT_TYPES)[number];

export const WAREHOUSE_RECEIPT_CUSTOMS_DECLARATION_TYPES = [
  'NO_DECLARATION',
  'BUY_ORDER',
  'FORMAL_DECLARATION',
] as const;
export type WarehouseReceiptCustomsDeclarationType =
  (typeof WAREHOUSE_RECEIPT_CUSTOMS_DECLARATION_TYPES)[number];

export const ALLOCATION_STATUSES = [
  'ALLOCATED',
  'PICKED',
  'LOADED',
  'SHIPPED',
  'CANCELLED',
] as const;
export type AllocationStatus = (typeof ALLOCATION_STATUSES)[number];

export const RESERVED_ALLOCATION_STATUSES = [
  'ALLOCATED',
  'PICKED',
  'LOADED',
] as const;
export type ReservedAllocationStatus =
  (typeof RESERVED_ALLOCATION_STATUSES)[number];

export const MOVEMENT_REF_TYPES = [
  'RECEIPT',
  'ALLOCATION',
  'PICK',
  'LOAD',
  'SHIP',
  'ADJUST',
] as const;
export type MovementRefType = (typeof MOVEMENT_REF_TYPES)[number];

export const PACKAGING_UNITS = [
  'CTNS',
  'PCS',
  'BALES',
  'BAGS',
  'WOODEN BOX',
  'WOODEN PALLET',
  'PLASTIC PALLET',
  'METAL PALLET',
  'OTHER',
] as const;
export type PackagingUnit = (typeof PACKAGING_UNITS)[number];
