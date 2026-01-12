import { freightFetch, freightQueryString } from '@/lib/freight/api-client';
import { transportNodeSchema } from '@/lib/freight/api-types';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

export const PORTS_QUERY_KEY = 'freight-ports';

/**
 * Get ports/transport nodes by search query
 */
export function useFreightPorts(query: string) {
  return useQuery({
    queryKey: [PORTS_QUERY_KEY, query],
    queryFn: async () => {
      return freightFetch(
        `/api/freight/ports${freightQueryString({ q: query })}`,
        {
          schema: z.array(transportNodeSchema),
        }
      );
    },
    enabled: query.length > 0,
  });
}
