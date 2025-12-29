'use client';

import { freightFetch, freightQueryString } from '@/lib/freight/api-client';
import {
  type FreightContainer,
  freightContainerSchema,
} from '@/lib/freight/api-types';
import { createContainerSchema } from '@/lib/freight/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { freightKeys } from './query-keys';

const containersArraySchema = z.array(freightContainerSchema);

export function useFreightContainersByShipment(shipmentId: string) {
  return useQuery({
    queryKey: freightKeys.containersByShipment(shipmentId),
    enabled: shipmentId.length > 0,
    queryFn: async () =>
      freightFetch(
        `/api/freight/shipments/${shipmentId}/containers${freightQueryString({})}`,
        { schema: containersArraySchema }
      ),
  });
}

export function useCreateFreightContainer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: z.infer<typeof createContainerSchema>) => {
      const body = createContainerSchema.parse(input);
      const { shipmentId, ...payload } = body;
      return freightFetch(
        `/api/freight/shipments/${body.shipmentId}/containers`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          schema: freightContainerSchema,
        }
      );
    },
    onSuccess: async (created: FreightContainer) => {
      await queryClient.invalidateQueries({
        queryKey: freightKeys.containersByShipment(created.shipmentId),
      });
    },
  });
}
