import { freightApiClient } from '@/lib/freight/api-client';
import type { TransportNode } from '@/lib/freight/api-types';
import { useQuery } from '@tanstack/react-query';

export const PORTS_QUERY_KEY = 'freight-ports';

/**
 * Get ports/transport nodes by search query
 */
export function useFreightPorts(query: string) {
  return useQuery({
    queryKey: [PORTS_QUERY_KEY, query],
    queryFn: async () => {
      const response = await freightApiClient.get('/api/freight/ports', {
        params: { q: query },
      });
      return response.data?.data || [];
    },
    enabled: query.length > 0,
  });
}

