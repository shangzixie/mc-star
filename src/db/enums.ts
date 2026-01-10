/**
 * Centralized enums that are persisted in the database as *string codes*.
 *
 * Why:
 * - Avoid Postgres `ENUM` types (schema changes for new values are painful)
 * - Keep a single source of truth for allowed codes across DB + API validation + UI
 *
 * Notes:
 * - The database stores the *code* (e.g. 'SEA_FCL'); UI can map to i18n labels.
 * - Validation is enforced at the application layer (e.g. Zod `z.enum(...)`).
 */

// -----------------------------------------------------------------------------
// Freight / Warehouse / Transport nodes
// -----------------------------------------------------------------------------

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
  // 运输类型（存储英文枚举码；UI 通过 i18n 显示中文）
  // SEA_FCL: 海运整柜
  // AIR_FREIGHT: 航空货运
  // SEA_LCL: 海运拼箱
  // DOMESTIC_TRANSPORT: 内贸运输
  // WAREHOUSING: 仓储服务
  // ROAD_FTL: 陆路运输（整车）
  // ROAD_LTL: 陆路运输（拼车）
  // EXPRESS_LINEHAUL: 快递/专线
  // FBA_SEA: FBA海运
  // FBA_AIR: FBA空运
  // FBA_RAIL: FBA铁路
  // BULK_CARGO: 散杂货船
  // RAIL_FREIGHT: 铁路运输
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
  // 报关类型（存储英文枚举码；UI 通过 i18n 显示中文）
  // NO_DECLARATION: 不报关
  // BUY_ORDER: 买单
  // FORMAL_DECLARATION: 正报
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


