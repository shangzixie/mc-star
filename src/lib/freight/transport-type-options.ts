import { WAREHOUSE_RECEIPT_TRANSPORT_TYPES } from './constants';

export const MERGE_RECEIPT_TRANSPORT_TYPES =
  WAREHOUSE_RECEIPT_TRANSPORT_TYPES.filter(
    (transportType) => transportType === 'SEA_LCL'
  );

export const STANDARD_RECEIPT_TRANSPORT_TYPES =
  WAREHOUSE_RECEIPT_TRANSPORT_TYPES.filter(
    (transportType) => transportType !== 'SEA_LCL'
  );
