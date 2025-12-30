export const freightKeys = {
  all: ['freight'] as const,

  parties: () => [...freightKeys.all, 'parties'] as const,
  partiesList: (params: { q: string }) =>
    [...freightKeys.parties(), 'list', params] as const,

  warehouses: () => [...freightKeys.all, 'warehouses'] as const,
  warehousesList: (params: { q: string }) =>
    [...freightKeys.warehouses(), 'list', params] as const,

  warehouseReceipts: () => [...freightKeys.all, 'warehouse-receipts'] as const,
  warehouseReceiptsList: (params: {
    warehouseId?: string;
    customerId?: string;
    q?: string;
  }) => [...freightKeys.warehouseReceipts(), 'list', params] as const,
  warehouseReceipt: (id: string) =>
    [...freightKeys.warehouseReceipts(), 'detail', id] as const,

  shipments: () => [...freightKeys.all, 'shipments'] as const,
  shipmentsList: (params: { q: string; status: string }) =>
    [...freightKeys.shipments(), 'list', params] as const,
  shipment: (id: string) => [...freightKeys.shipments(), 'detail', id] as const,

  containers: () => [...freightKeys.all, 'containers'] as const,
  containersByShipment: (shipmentId: string) =>
    [...freightKeys.containers(), 'by-shipment', shipmentId] as const,

  allocations: () => [...freightKeys.all, 'allocations'] as const,
  allocationsByShipment: (shipmentId: string) =>
    [...freightKeys.allocations(), 'by-shipment', shipmentId] as const,

  inventoryItems: () => [...freightKeys.all, 'inventory-items'] as const,
  inventoryItemsList: (params: { receiptId: string; q: string }) =>
    [...freightKeys.inventoryItems(), 'list', params] as const,

  attachments: () => [...freightKeys.all, 'attachments'] as const,
  attachmentsByShipment: (shipmentId: string) =>
    [...freightKeys.attachments(), 'by-shipment', shipmentId] as const,
};
