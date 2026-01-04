'use client';

import { freightFetch } from '@/lib/freight/api-client';
import {
  type FreightInventoryItemAllocationView,
  freightInventoryItemAllocationViewSchema,
} from '@/lib/freight/api-types';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { freightKeys } from './query-keys';

const allocationViewsArraySchema = z.array(
  freightInventoryItemAllocationViewSchema
);

export function useFreightInventoryItemAllocations(itemId: string) {
  return useQuery({
    queryKey: freightKeys.inventoryItemAllocations(itemId),
    enabled: itemId.trim().length > 0,
    queryFn: async (): Promise<FreightInventoryItemAllocationView[]> =>
      freightFetch(`/api/freight/inventory-items/${itemId}/allocations`, {
        schema: allocationViewsArraySchema,
      }),
  });
}
