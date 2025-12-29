'use client';

import { CreateShipmentDialog } from '@/components/freight/shipments/create-shipment-dialog';
import { ShipmentsTable } from '@/components/freight/shipments/shipments-table';
import { Input } from '@/components/ui/input';
import { useFreightShipments } from '@/hooks/freight/use-freight-shipments';
import { SHIPMENT_STATUSES } from '@/lib/freight/constants';
import { useTranslations } from 'next-intl';
import { parseAsString, useQueryStates } from 'nuqs';
import { useMemo } from 'react';

export function ShipmentsPageClient() {
  const t = useTranslations('Dashboard.freight.shipments');

  const [{ q, status }, setQueryStates] = useQueryStates({
    q: parseAsString.withDefault(''),
    status: parseAsString.withDefault(''),
  });

  const params = useMemo(() => ({ q, status }), [q, status]);
  const { data, isLoading, error } = useFreightShipments(params);

  return (
    <div className="px-4 lg:px-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Input
              value={q}
              onChange={(e) => setQueryStates({ q: e.target.value })}
              placeholder={t('searchPlaceholder')}
              className="w-full sm:w-[320px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={status}
              onChange={(e) => setQueryStates({ status: e.target.value })}
            >
              <option value="">{t('statusAll')}</option>
              {SHIPMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <CreateShipmentDialog />
          </div>
        </div>

        <ShipmentsTable
          shipments={data ?? []}
          loading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
}
