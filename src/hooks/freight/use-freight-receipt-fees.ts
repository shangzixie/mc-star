'use client';

import {
  freightFetch,
  freightFetchVoid,
  freightQueryString,
} from '@/lib/freight/api-client';
import {
  type FreightWarehouseReceiptFee,
  freightWarehouseReceiptFeeSchema,
} from '@/lib/freight/api-types';
import {
  warehouseReceiptFeeCreateSchema,
  warehouseReceiptFeeUpdateSchema,
} from '@/lib/freight/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { freightKeys } from './query-keys';

const feesArraySchema = z.array(freightWarehouseReceiptFeeSchema);

export function useFreightWarehouseReceiptFees(params: {
  receiptId: string;
  feeType?: 'AR' | 'AP';
}) {
  return useQuery({
    queryKey: [...freightKeys.receiptFeesByReceipt(params.receiptId), params],
    enabled: params.receiptId.trim().length > 0,
    queryFn: async () =>
      freightFetch(
        `/api/freight/warehouse-receipts/${params.receiptId}/fees${freightQueryString(
          { feeType: params.feeType }
        )}`,
        { schema: feesArraySchema }
      ),
  });
}

export function useCreateFreightWarehouseReceiptFee(receiptId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: z.infer<typeof warehouseReceiptFeeCreateSchema>
    ) => {
      const body = warehouseReceiptFeeCreateSchema.parse(input);
      return freightFetch(`/api/freight/warehouse-receipts/${receiptId}/fees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        schema: freightWarehouseReceiptFeeSchema,
      });
    },
    onSuccess: async (_created: FreightWarehouseReceiptFee) => {
      await queryClient.invalidateQueries({
        queryKey: freightKeys.receiptFeesByReceipt(receiptId),
      });
    },
  });
}

export function useUpdateFreightWarehouseReceiptFee(
  receiptId: string,
  feeId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: z.infer<typeof warehouseReceiptFeeUpdateSchema>
    ) => {
      const body = warehouseReceiptFeeUpdateSchema.parse(input);
      return freightFetch(
        `/api/freight/warehouse-receipts/${receiptId}/fees/${feeId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          schema: freightWarehouseReceiptFeeSchema,
        }
      );
    },
    onSuccess: async (_updated: FreightWarehouseReceiptFee) => {
      await queryClient.invalidateQueries({
        queryKey: freightKeys.receiptFeesByReceipt(receiptId),
      });
    },
  });
}

export function useDeleteFreightWarehouseReceiptFee(
  receiptId: string,
  feeId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () =>
      freightFetchVoid(
        `/api/freight/warehouse-receipts/${receiptId}/fees/${feeId}`,
        { method: 'DELETE' }
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: freightKeys.receiptFeesByReceipt(receiptId),
      });
    },
  });
}
