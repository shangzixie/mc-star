'use client';

import { freightFetch } from '@/lib/freight/api-client';
import {
  type FreightAllocation,
  freightAllocationSchema,
} from '@/lib/freight/api-types';
import {
  createAllocationSchema,
  loadAllocationSchema,
  pickAllocationSchema,
  shipAllocationSchema,
  splitAllocationSchema,
} from '@/lib/freight/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { freightKeys } from './query-keys';

const allocationsArraySchema = z.array(freightAllocationSchema);

export function useFreightAllocationsByShipment(shipmentId: string) {
  return useQuery({
    queryKey: freightKeys.allocationsByShipment(shipmentId),
    enabled: shipmentId.length > 0,
    queryFn: async () =>
      freightFetch(`/api/freight/allocations?shipmentId=${shipmentId}`, {
        schema: allocationsArraySchema,
      }),
  });
}

export function useCreateFreightAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: z.infer<typeof createAllocationSchema>) => {
      const body = createAllocationSchema.parse(input);
      return freightFetch('/api/freight/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        schema: freightAllocationSchema,
      });
    },
    onSuccess: async (created: FreightAllocation) => {
      await queryClient.invalidateQueries({
        queryKey: freightKeys.allocationsByShipment(created.shipmentId),
      });
    },
  });
}

export function usePickFreightAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { allocationId: string; pickedQty: number }) => {
      const body = pickAllocationSchema.parse({ pickedQty: input.pickedQty });
      return freightFetch(
        `/api/freight/allocations/${input.allocationId}/pick`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          schema: freightAllocationSchema,
        }
      );
    },
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({
        queryKey: freightKeys.allocationsByShipment(updated.shipmentId),
      });
    },
  });
}

export function useLoadFreightAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      allocationId: string;
      loadedQty: number;
      containerId?: string;
    }) => {
      const body = loadAllocationSchema.parse({
        loadedQty: input.loadedQty,
        containerId: input.containerId,
      });
      return freightFetch(
        `/api/freight/allocations/${input.allocationId}/load`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          schema: freightAllocationSchema,
        }
      );
    },
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({
        queryKey: freightKeys.allocationsByShipment(updated.shipmentId),
      });
    },
  });
}

export function useShipFreightAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { allocationId: string; shippedQty: number }) => {
      const body = shipAllocationSchema.parse({ shippedQty: input.shippedQty });
      return freightFetch(
        `/api/freight/allocations/${input.allocationId}/ship`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          schema: freightAllocationSchema,
        }
      );
    },
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({
        queryKey: freightKeys.allocationsByShipment(updated.shipmentId),
      });
    },
  });
}

export function useCancelFreightAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { allocationId: string }) =>
      freightFetch(`/api/freight/allocations/${input.allocationId}/cancel`, {
        method: 'POST',
        schema: freightAllocationSchema,
      }),
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({
        queryKey: freightKeys.allocationsByShipment(updated.shipmentId),
      });
    },
  });
}

export function useSplitFreightAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      allocationId: string;
      splitQty: number;
      newContainerId?: string;
    }) => {
      const body = splitAllocationSchema.parse({
        splitQty: input.splitQty,
        newContainerId: input.newContainerId,
      });
      return freightFetch(
        `/api/freight/allocations/${input.allocationId}/split`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          schema: z.object({
            original: freightAllocationSchema,
            split: freightAllocationSchema,
          }),
        }
      );
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({
        queryKey: freightKeys.allocationsByShipment(result.original.shipmentId),
      });
    },
  });
}
