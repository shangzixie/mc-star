'use client';

import { freightFetch, freightQueryString } from '@/lib/freight/api-client';
import {
  type FreightInventoryItem,
  type FreightWarehouseReceipt,
  freightInventoryItemSchema,
  freightWarehouseReceiptSchema,
} from '@/lib/freight/api-types';
import {
  addInventoryItemSchema,
  createWarehouseReceiptSchema,
} from '@/lib/freight/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { freightKeys } from './query-keys';

const receiptsArraySchema = z.array(freightWarehouseReceiptSchema);

export function useFreightWarehouseReceipts(params: {
  warehouseId?: string;
  customerId?: string;
}) {
  return useQuery({
    queryKey: freightKeys.warehouseReceiptsList(params),
    queryFn: async () =>
      freightFetch(
        `/api/freight/warehouse-receipts${freightQueryString({
          warehouseId: params.warehouseId,
          customerId: params.customerId,
        })}`,
        { schema: receiptsArraySchema }
      ),
  });
}

export function useCreateFreightWarehouseReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: z.infer<typeof createWarehouseReceiptSchema>) => {
      const body = createWarehouseReceiptSchema.parse(input);

      return freightFetch('/api/freight/warehouse-receipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        schema: freightWarehouseReceiptSchema,
      });
    },
    onSuccess: async (created: FreightWarehouseReceipt) => {
      await queryClient.invalidateQueries({
        queryKey: freightKeys.warehouseReceipts(),
      });
      queryClient.setQueryData(
        freightKeys.warehouseReceiptsList({
          warehouseId: created.warehouseId ?? undefined,
          customerId: created.customerId ?? undefined,
        }),
        (prev) => {
          const existing = receiptsArraySchema.safeParse(prev);
          if (!existing.success) return [created];
          return [created, ...existing.data];
        }
      );
    },
  });
}

const addItemToReceiptSchema = addInventoryItemSchema.omit({ receiptId: true });

export function useAddFreightInventoryItemToReceipt(receiptId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: z.infer<typeof addItemToReceiptSchema>
    ): Promise<FreightInventoryItem> => {
      const body = addItemToReceiptSchema.parse(input);

      return freightFetch(
        `/api/freight/warehouse-receipts/${receiptId}/items`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          schema: freightInventoryItemSchema,
        }
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: freightKeys.inventoryItems(),
      });
    },
  });
}
