import { useQuery } from '@tanstack/react-query';

export interface FreightEmployee {
  id: string;
  userId: string | null;
  fullName: string;
  branch: string;
  department: string;
}

interface UseFreightEmployeesParams {
  q?: string;
}

/**
 * Hook to fetch freight employees with fuzzy search support
 */
export function useFreightEmployees(params: UseFreightEmployeesParams = {}) {
  const { q = '' } = params;

  return useQuery<FreightEmployee[]>({
    queryKey: ['freight', 'employees', { q }],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (q) searchParams.set('q', q);

      const url = `/api/freight/employees${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      const res = await fetch(url);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch employees');
      }

      const json = await res.json();
      return json.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
