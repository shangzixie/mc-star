'use client';

import { freightFetch, freightFetchVoid, freightQueryString } from '@/lib/freight/api-client';
import {
  freightPartySchema,
  freightWarehouseSchema,
  type FreightParty,
  type FreightWarehouse,
} from '@/lib/freight/api-types';
import { createPartySchema, createWarehouseSchema } from '@/lib/freight/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { freightKeys } from './query-keys';

const partiesArraySchema = z.array(freightPartySchema);
const warehousesArraySchema = z.array(freightWarehouseSchema);

export function useFreightParties(params: { q: string }) {
  return useQuery({
    queryKey: freightKeys.partiesList(params),
    queryFn: async () =>
      freightFetch(`/api/freight/parties${freightQueryString(params)}`, {
        schema: partiesArraySchema,
      }),
  });
}

export function useCreateFreightParty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: z.infer<typeof createPartySchema>) => {
      const body = createPartySchema.parse(input);

      return freightFetch('/api/freight/parties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        schema: freightPartySchema,
      });
    },
    onSuccess: async (_created: FreightParty) => {
      await queryClient.invalidateQueries({ queryKey: freightKeys.parties() });
    },
  });
}

const updatePartySchema = createPartySchema.partial();

export function useUpdateFreightParty(partyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: z.infer<typeof updatePartySchema>) => {
      const body = updatePartySchema.parse(input);

      return freightFetch(`/api/freight/parties/${partyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        schema: freightPartySchema,
      });
    },
    onSuccess: async (_updated: FreightParty) => {
      await queryClient.invalidateQueries({ queryKey: freightKeys.parties() });
    },
  });
}

export function useDeactivateFreightParty(partyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () =>
      freightFetchVoid(`/api/freight/parties/${partyId}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: freightKeys.parties() });
    },
  });
}

export function useFreightWarehouses(params: { q: string }) {
  return useQuery({
    queryKey: freightKeys.warehousesList(params),
    queryFn: async () =>
      freightFetch(`/api/freight/warehouses${freightQueryString(params)}`, {
        schema: warehousesArraySchema,
      }),
  });
}

export function useCreateFreightWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: z.infer<typeof createWarehouseSchema>) => {
      const body = createWarehouseSchema.parse(input);

      return freightFetch('/api/freight/warehouses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        schema: freightWarehouseSchema,
      });
    },
    onSuccess: async (_created: FreightWarehouse) => {
      await queryClient.invalidateQueries({
        queryKey: freightKeys.warehouses(),
      });
    },
  });
}

const updateWarehouseSchema = createWarehouseSchema.partial();

export function useUpdateFreightWarehouse(warehouseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: z.infer<typeof updateWarehouseSchema>) => {
      const body = updateWarehouseSchema.parse(input);

      return freightFetch(`/api/freight/warehouses/${warehouseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        schema: freightWarehouseSchema,
      });
    },
    onSuccess: async (_updated: FreightWarehouse) => {
      await queryClient.invalidateQueries({ queryKey: freightKeys.warehouses() });
    },
  });
}

export function useDeactivateFreightWarehouse(warehouseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () =>
      freightFetchVoid(`/api/freight/warehouses/${warehouseId}`, {
        method: 'DELETE',
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: freightKeys.warehouses() });
    },
  });
}


