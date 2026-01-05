'use client';

import { freightFetch, freightQueryString } from '@/lib/freight/api-client';
import {
  type FreightInventoryItem,
  type FreightWarehouseReceipt,
  freightInventoryItemSchema,
  freightWarehouseReceiptSchema,
  freightWarehouseReceiptWithRelationsSchema,
} from '@/lib/freight/api-types';
import {
  addInventoryItemSchema,
  createWarehouseReceiptSchema,
} from '@/lib/freight/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { freightKeys } from './query-keys';

const receiptsArraySchema = z.array(freightWarehouseReceiptWithRelationsSchema);

export function useFreightWarehouseReceipts(params: {
  warehouseId?: string;
  customerId?: string;
  q?: string;
  status?: string;
  includeStats?: boolean;
  includeItemNames?: boolean;
}) {
  return useQuery({
    queryKey: freightKeys.warehouseReceiptsList(params),
    queryFn: async () =>
      freightFetch(
        `/api/freight/warehouse-receipts${freightQueryString({
          warehouseId: params.warehouseId,
          customerId: params.customerId,
          q: params.q,
          status: params.status,
          includeStats: params.includeStats ? '1' : undefined,
          includeItemNames: params.includeItemNames ? '1' : undefined,
        })}`,
        { schema: receiptsArraySchema }
      ),
  });
}

export function useFreightWarehouseReceipt(id: string) {
  return useQuery({
    queryKey: freightKeys.warehouseReceipt(id),
    enabled: id.trim().length > 0,
    queryFn: async () =>
      freightFetch(`/api/freight/warehouse-receipts/${id}`, {
        schema: freightWarehouseReceiptWithRelationsSchema,
      }),
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
      // Also invalidate the specific receipt to update stats
      await queryClient.invalidateQueries({
        queryKey: freightKeys.warehouseReceipt(receiptId),
      });
    },
  });
}

export function useUpdateFreightWarehouseReceipt(receiptId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      warehouseId?: string;
      customerId?: string;
      transportType?: string;
      customsDeclarationType?: string;
      status?: string;
      inboundTime?: string;
      remarks?: string;
      internalRemarks?: string;
    }) => {
      const { updateWarehouseReceipt } = await import(
        '@/lib/freight/api-client'
      );
      return updateWarehouseReceipt(receiptId, input);
    },
    onSuccess: async (updated) => {
      // Update the cache for this specific receipt
      queryClient.setQueryData(
        freightKeys.warehouseReceipt(receiptId),
        updated
      );
      // Invalidate all receipt lists
      await queryClient.invalidateQueries({
        queryKey: freightKeys.warehouseReceipts(),
      });
    },
  });
}

export function useDeleteFreightWarehouseReceipt(receiptId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { deleteWarehouseReceipt } = await import(
        '@/lib/freight/api-client'
      );
      return deleteWarehouseReceipt(receiptId);
    },
    onSuccess: async () => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: freightKeys.warehouseReceipt(receiptId),
      });
      // Invalidate all receipt lists
      await queryClient.invalidateQueries({
        queryKey: freightKeys.warehouseReceipts(),
      });
    },
  });
}
