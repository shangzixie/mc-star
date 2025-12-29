export const freightKeys = {
  all: ['freight'] as const,

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
