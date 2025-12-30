'use client';

import { getSortingStateParser } from '@/components/data-table/lib/parsers';
import type { ExtendedColumnSort } from '@/components/data-table/types/data-table';
import { CreateShipmentDialog } from '@/components/freight/shipments/create-shipment-dialog';
import { ShipmentsTable } from '@/components/freight/shipments/shipments-table';
import { useFreightShipments } from '@/hooks/freight/use-freight-shipments';
import type { FreightShipment } from '@/lib/freight/api-types';
import type { SortingState } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import {
  parseAsIndex,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from 'nuqs';
import { useMemo } from 'react';

export function ShipmentsPageClient() {
  const t = useTranslations('Dashboard.freight.shipments');

  const sortableColumnIds = useMemo(
    () => ['jobNo', 'status', 'transportMode', 'etd', 'eta', 'createdAt'],
    []
  );
  const sortableColumnSet = useMemo(
    () => new Set<string>(sortableColumnIds),
    [sortableColumnIds]
  );
  const defaultSorting = useMemo<ExtendedColumnSort<FreightShipment>[]>(
    () => [{ id: 'createdAt', desc: true }],
    []
  );

  const [{ q, status, page, size, sort }, setQueryStates] = useQueryStates({
    q: parseAsString.withDefault(''),
    status: parseAsString.withDefault(''),
    page: parseAsIndex.withDefault(0),
    size: parseAsInteger.withDefault(10),
    sort: getSortingStateParser<FreightShipment>(sortableColumnIds).withDefault(
      defaultSorting
    ),
  });

  const normalizeSorting = (value: SortingState) => {
    const filtered = value.filter((item) => sortableColumnSet.has(item.id));
    return filtered.length > 0 ? filtered : defaultSorting;
  };

  const safeSorting = normalizeSorting(sort);

  const params = useMemo(() => ({ q, status }), [q, status]);
  const { data, isLoading, error } = useFreightShipments(params);

  return (
    <div className="px-4 lg:px-6">
      <ShipmentsTable
        shipments={data ?? []}
        loading={isLoading}
        error={error}
        search={q}
        status={status}
        pageIndex={page}
        pageSize={size}
        sorting={safeSorting}
        onSearch={(next) =>
          setQueryStates({ q: next, page: 0 }, { shallow: true })
        }
        onStatusChange={(next) =>
          setQueryStates({ status: next, page: 0 }, { shallow: true })
        }
        onPageChange={(next) =>
          setQueryStates({ page: next }, { shallow: true })
        }
        onPageSizeChange={(next) =>
          setQueryStates({ size: next, page: 0 }, { shallow: true })
        }
        onSortingChange={(next) =>
          setQueryStates(
            { sort: normalizeSorting(next), page: 0 },
            { shallow: true }
          )
        }
        actions={<CreateShipmentDialog />}
      />
    </div>
  );
}
