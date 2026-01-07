import { freightMasterBillOfLadingSchema } from '@/lib/freight/api-types';
import { freightApiClient } from '@/lib/freight/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const MBL_QUERY_KEY = 'freight-master-bills-of-lading';

/**
 * Get MBL by receipt ID
 */
export function useFreightMBL(receiptId: string) {
  return useQuery({
    queryKey: [MBL_QUERY_KEY, receiptId],
    queryFn: async () => {
      const response = await freightApiClient.get(
        `/api/freight/master-bills-of-lading/${receiptId}`
      );
      const data = response.data;
      // Allow null response (no MBL created yet)
      return data ? freightMasterBillOfLadingSchema.parse(data) : null;
    },
    enabled: !!receiptId,
  });
}

/**
 * Create MBL
 */
export function useCreateFreightMBL(receiptId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: Partial<{
        portOfDestination?: string;
        countryOfDestination?: string;
        portOfDischarge?: string;
        portOfLoading?: string;
        placeOfReceipt?: string;
      }>
    ) => {
      const response = await freightApiClient.post(
        `/api/freight/master-bills-of-lading/${receiptId}`,
        data
      );
      return freightMasterBillOfLadingSchema.parse(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MBL_QUERY_KEY, receiptId] });
    },
  });
}

/**
 * Update MBL
 */
export function useUpdateFreightMBL(receiptId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: Partial<{
        portOfDestination?: string;
        countryOfDestination?: string;
        portOfDischarge?: string;
        portOfLoading?: string;
        placeOfReceipt?: string;
      }>
    ) => {
      const response = await freightApiClient.patch(
        `/api/freight/master-bills-of-lading/${receiptId}`,
        data
      );
      return freightMasterBillOfLadingSchema.parse(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MBL_QUERY_KEY, receiptId] });
    },
  });
}

