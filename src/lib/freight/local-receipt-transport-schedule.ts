import { z } from 'zod';

export const AIR_OPERATION_NODES = [
  'SPACE_BOOKED',
  'PICKING_UP_GOODS',
  'IN_PROCESSING',
  'WEIGHT_CONFIRMED',
  'CUSTOMS_DECLARATION_IN_PROGRESS',
  'CUSTOMS_CLEARED',
  'RECEIPT_RETURNED',
  'COMPLETED',
] as const;

export type AirOperationNode = (typeof AIR_OPERATION_NODES)[number];

export const receiptTransportScheduleSchema = z
  .object({
    // Air freight
    airCarrier: z.string().max(200).optional(),
    airFlightNo: z.string().max(100).optional(),
    airFlightDate: z.string().max(20).optional(), // yyyy-mm-dd
    airArrivalDateE: z.string().max(20).optional(), // yyyy-mm-dd
    airOperationLocation: z.string().max(200).optional(),
    airOperationNode: z.enum(AIR_OPERATION_NODES).optional(),

    // Sea freight
    seaCarrierRoute: z.string().max(200).optional(),
    seaVesselVoyage: z.string().max(200).optional(),
    seaEtdE: z.string().max(20).optional(), // yyyy-mm-dd
    seaEtaE: z.string().max(20).optional(), // yyyy-mm-dd
  })
  .passthrough();

export type ReceiptTransportSchedule = z.infer<
  typeof receiptTransportScheduleSchema
>;

const STORAGE_KEY_PREFIX = 'freight:inbound:receipt-transport-schedule:';

function getStorageKey(receiptId: string) {
  return `${STORAGE_KEY_PREFIX}${receiptId}`;
}

export function normalizeReceiptTransportSchedule(
  input: ReceiptTransportSchedule | null | undefined
): Required<ReceiptTransportSchedule> {
  const v = input ?? {};
  return {
    airCarrier: v.airCarrier ?? '',
    airFlightNo: v.airFlightNo ?? '',
    airFlightDate: v.airFlightDate ?? '',
    airArrivalDateE: v.airArrivalDateE ?? '',
    airOperationLocation: v.airOperationLocation ?? '',
    airOperationNode: (v.airOperationNode ?? undefined) as any,

    seaCarrierRoute: v.seaCarrierRoute ?? '',
    seaVesselVoyage: v.seaVesselVoyage ?? '',
    seaEtdE: v.seaEtdE ?? '',
    seaEtaE: v.seaEtaE ?? '',
  };
}

export function isSameReceiptTransportSchedule(
  a: ReceiptTransportSchedule | null | undefined,
  b: ReceiptTransportSchedule | null | undefined
) {
  const na = normalizeReceiptTransportSchedule(a);
  const nb = normalizeReceiptTransportSchedule(b);
  return (
    na.airCarrier === nb.airCarrier &&
    na.airFlightNo === nb.airFlightNo &&
    na.airFlightDate === nb.airFlightDate &&
    na.airArrivalDateE === nb.airArrivalDateE &&
    na.airOperationLocation === nb.airOperationLocation &&
    (na.airOperationNode ?? '') === (nb.airOperationNode ?? '') &&
    na.seaCarrierRoute === nb.seaCarrierRoute &&
    na.seaVesselVoyage === nb.seaVesselVoyage &&
    na.seaEtdE === nb.seaEtdE &&
    na.seaEtaE === nb.seaEtaE
  );
}

export function getReceiptTransportScheduleFromStorage(receiptId: string) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(getStorageKey(receiptId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const v = receiptTransportScheduleSchema.safeParse(parsed);
    return v.success ? v.data : null;
  } catch {
    return null;
  }
}

export function setReceiptTransportScheduleToStorage(
  receiptId: string,
  schedule: ReceiptTransportSchedule
) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      getStorageKey(receiptId),
      JSON.stringify(schedule)
    );
  } catch {
    // Ignore write errors (private mode, quota exceeded, etc.)
  }
}
