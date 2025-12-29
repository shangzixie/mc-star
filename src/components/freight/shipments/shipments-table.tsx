'use client';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LocaleLink } from '@/i18n/navigation';
import { formatDate } from '@/lib/formatter';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import type { FreightShipment } from '@/lib/freight/api-types';
import { Routes } from '@/routes';
import { useTranslations } from 'next-intl';

function ShipmentStatusBadge({ status }: { status: string }) {
  const variant =
    status === 'DRAFT'
      ? 'secondary'
      : status === 'BOOKED'
        ? 'default'
        : status === 'SHIPPED'
          ? 'outline'
          : 'secondary';

  return <Badge variant={variant}>{status}</Badge>;
}

export function ShipmentsTable({
  shipments,
  loading,
  error,
}: {
  shipments: FreightShipment[];
  loading: boolean;
  error: unknown;
}) {
  const t = useTranslations('Dashboard.freight.shipments');

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('columns.jobNo')}</TableHead>
            <TableHead>{t('columns.status')}</TableHead>
            <TableHead className="hidden md:table-cell">
              {t('columns.transportMode')}
            </TableHead>
            <TableHead className="hidden md:table-cell">
              {t('columns.etd')}
            </TableHead>
            <TableHead className="hidden md:table-cell">
              {t('columns.eta')}
            </TableHead>
            <TableHead className="hidden lg:table-cell">
              {t('columns.createdAt')}
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <TableRow key={`sk-${idx}`}>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
              </TableRow>
            ))
          ) : error ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-8 text-center text-muted-foreground"
              >
                {getFreightApiErrorMessage(error)}
              </TableCell>
            </TableRow>
          ) : shipments.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-8 text-center text-muted-foreground"
              >
                {t('empty')}
              </TableCell>
            </TableRow>
          ) : (
            shipments.map((s) => (
              <TableRow key={s.id} className="hover:bg-muted/40">
                <TableCell className="font-medium">
                  <LocaleLink href={`${Routes.FreightShipments}/${s.id}`}>
                    <span className="underline-offset-4 hover:underline">
                      {s.jobNo}
                    </span>
                  </LocaleLink>
                </TableCell>
                <TableCell>
                  <ShipmentStatusBadge status={s.status} />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {s.transportMode}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {s.etd ? formatDate(new Date(s.etd)) : '-'}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {s.eta ? formatDate(new Date(s.eta)) : '-'}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {s.createdAt ? formatDate(new Date(s.createdAt)) : '-'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
