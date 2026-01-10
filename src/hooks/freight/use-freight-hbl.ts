import { freightApiClient } from '@/lib/freight/api-client';
import { freightHouseBillOfLadingSchema } from '@/lib/freight/api-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const HBL_QUERY_KEY = 'freight-house-bills-of-lading';

/**
 * Get HBL by receipt ID
 */
export function useFreightHBL(receiptId: string) {
  return useQuery({
    queryKey: [HBL_QUERY_KEY, receiptId],
    queryFn: async () => {
      const response = await freightApiClient.get(
        `/api/freight/house-bills-of-lading/${receiptId}`
      );
      const payload = (response.data as any)?.data ?? null;
      return payload ? freightHouseBillOfLadingSchema.parse(payload) : null;
    },
    enabled: !!receiptId,
  });
}

/**
 * Create HBL
 */
export function useCreateFreightHBL(receiptId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: Partial<{
        hblNo?: string;
        portOfDestinationId?: string;
        portOfDischargeId?: string;
        portOfLoadingId?: string;
        placeOfReceiptId?: string;
      }>
    ) => {
      const response = await freightApiClient.post(
        `/api/freight/house-bills-of-lading/${receiptId}`,
        data
      );
      const payload = (response.data as any)?.data;
      return freightHouseBillOfLadingSchema.parse(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HBL_QUERY_KEY, receiptId] });
    },
  });
}

/**
 * Update HBL
 */
export function useUpdateFreightHBL(receiptId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: Partial<{
        hblNo?: string | null;
        portOfDestinationId?: string;
        portOfDischargeId?: string;
        portOfLoadingId?: string;
        placeOfReceiptId?: string;
      }>
    ) => {
      const response = await freightApiClient.patch(
        `/api/freight/house-bills-of-lading/${receiptId}`,
        data
      );
      const payload = (response.data as any)?.data;
      return freightHouseBillOfLadingSchema.parse(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HBL_QUERY_KEY, receiptId] });
    },
  });
}
