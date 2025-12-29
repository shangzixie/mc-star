'use client';

import { freightFetch, freightQueryString } from '@/lib/freight/api-client';
import { freightInventoryItemSchema } from '@/lib/freight/api-types';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { freightKeys } from './query-keys';

const inventoryItemsArraySchema = z.array(freightInventoryItemSchema);

export function useFreightInventoryItems(params: {
  receiptId: string;
  q: string;
}) {
  return useQuery({
    queryKey: freightKeys.inventoryItemsList(params),
    queryFn: async () =>
      freightFetch(
        `/api/freight/inventory-items${freightQueryString(params)}`,
        {
          schema: inventoryItemsArraySchema,
        }
      ),
  });
}
