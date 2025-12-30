'use client';

import { freightFetch, freightQueryString } from '@/lib/freight/api-client';
import { freightInventoryItemSchema } from '@/lib/freight/api-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { freightKeys } from './query-keys';

const inventoryItemsArraySchema = z.array(freightInventoryItemSchema);

export function useFreightInventoryItems(params: {
  receiptId: string;
  q: string;
}) {
  return useQuery({
    queryKey: freightKeys.inventoryItemsList(params),
    enabled: params.receiptId.length > 0,
    queryFn: async () =>
      freightFetch(
        `/api/freight/inventory-items${freightQueryString(params)}`,
        {
          schema: inventoryItemsArraySchema,
        }
      ),
  });
}

export function useFreightInventoryItem(itemId: string) {
  return useQuery({
    queryKey: freightKeys.inventoryItem(itemId),
    enabled: itemId.length > 0,
    queryFn: async () => {
      const { getInventoryItem } = await import('@/lib/freight/api-client');
      return getInventoryItem(itemId);
    },
  });
}

export function useUpdateFreightInventoryItem(itemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      commodityName?: string;
      skuCode?: string;
      unit?: string;
      binLocation?: string;
      weightPerUnit?: number;
      lengthCm?: number;
      widthCm?: number;
      heightCm?: number;
    }) => {
      const { updateInventoryItem } = await import('@/lib/freight/api-client');
      return updateInventoryItem(itemId, input);
    },
    onSuccess: async (updated) => {
      // Update the cache for this specific item
      queryClient.setQueryData(freightKeys.inventoryItem(itemId), updated);
      // Invalidate all inventory item lists
      await queryClient.invalidateQueries({
        queryKey: freightKeys.inventoryItems(),
      });
    },
  });
}

export function useDeleteFreightInventoryItem(
  itemId: string,
  receiptId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { deleteInventoryItem } = await import('@/lib/freight/api-client');
      return deleteInventoryItem(itemId);
    },
    onSuccess: async () => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: freightKeys.inventoryItem(itemId),
      });
      // Invalidate inventory item lists
      await queryClient.invalidateQueries({
        queryKey: freightKeys.inventoryItems(),
      });
      // Invalidate the receipt to update stats
      await queryClient.invalidateQueries({
        queryKey: freightKeys.warehouseReceipt(receiptId),
      });
    },
  });
}

export function useFreightInventoryMovements(itemId: string) {
  return useQuery({
    queryKey: freightKeys.inventoryMovements(itemId),
    enabled: itemId.length > 0,
    queryFn: async () => {
      const { getInventoryMovements } = await import(
        '@/lib/freight/api-client'
      );
      return getInventoryMovements(itemId);
    },
  });
}
