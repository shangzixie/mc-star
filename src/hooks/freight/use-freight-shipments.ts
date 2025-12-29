'use client';

import { freightFetch, freightQueryString } from '@/lib/freight/api-client';
import {
  type FreightShipment,
  freightShipmentSchema,
} from '@/lib/freight/api-types';
import { createShipmentSchema } from '@/lib/freight/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { freightKeys } from './query-keys';

const shipmentsArraySchema = z.array(freightShipmentSchema);

export function useFreightShipments(params: { q: string; status: string }) {
  return useQuery({
    queryKey: freightKeys.shipmentsList(params),
    queryFn: async () =>
      freightFetch(`/api/freight/shipments${freightQueryString(params)}`, {
        schema: shipmentsArraySchema,
      }),
  });
}

export function useFreightShipment(id: string) {
  return useQuery({
    queryKey: freightKeys.shipment(id),
    enabled: id.length > 0,
    queryFn: async () =>
      freightFetch(`/api/freight/shipments/${id}`, {
        schema: freightShipmentSchema,
      }),
  });
}

export function useCreateFreightShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: z.infer<typeof createShipmentSchema>) => {
      const body = createShipmentSchema.parse(input);

      return freightFetch('/api/freight/shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        schema: freightShipmentSchema,
      });
    },
    onSuccess: async (created: FreightShipment) => {
      await queryClient.invalidateQueries({
        queryKey: freightKeys.shipments(),
      });
      queryClient.setQueryData(freightKeys.shipment(created.id), created);
    },
  });
}
