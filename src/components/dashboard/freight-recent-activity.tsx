'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useFreightShipments } from '@/hooks/freight/use-freight-shipments';
import { useFreightWarehouseReceipts } from '@/hooks/freight/use-freight-warehouse-receipts';
import { format } from 'date-fns';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';

export function FreightRecentActivity() {
  const t = useTranslations('Dashboard.dashboard');
  const locale = useLocale();
  const receiptsQuery = useFreightWarehouseReceipts({ q: '', status: '' });
  const shipmentsQuery = useFreightShipments({ q: '', status: '' });

  const receipts = (receiptsQuery.data ?? []).slice(0, 6);
  const shipments = (shipmentsQuery.data ?? []).slice(0, 6);

  return (
    <div className="grid gap-4 px-4 lg:px-6 @xl/main:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {t('recent.receiptsTitle')}
          </CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/freight/inbound">{t('recent.viewAll')}</Link>
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {receiptsQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead>
                      {t('recent.receipts.columns.receiptNo')}
                    </TableHead>
                    <TableHead>{t('recent.receipts.columns.status')}</TableHead>
                    <TableHead className="text-right">
                      {t('recent.receipts.columns.inboundTime')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        {t('recent.receipts.empty')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    receipts.map((r) => (
                      <TableRow key={r.id} className="h-12">
                        <TableCell className="font-medium">
                          {r.receiptNo}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {r.status}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {r.inboundTime
                            ? format(
                                new Date(r.inboundTime),
                                locale === 'zh' ? 'MM-dd HH:mm' : 'MMM dd HH:mm'
                              )
                            : r.createdAt
                              ? format(
                                  new Date(r.createdAt),
                                  locale === 'zh'
                                    ? 'MM-dd HH:mm'
                                    : 'MMM dd HH:mm'
                                )
                              : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {t('recent.shipmentsTitle')}
          </CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/freight/shipments">{t('recent.viewAll')}</Link>
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {shipmentsQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead>{t('recent.shipments.columns.jobNo')}</TableHead>
                    <TableHead>
                      {t('recent.shipments.columns.status')}
                    </TableHead>
                    <TableHead className="text-right">
                      {t('recent.shipments.columns.createdAt')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        {t('recent.shipments.empty')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    shipments.map((s) => (
                      <TableRow key={s.id} className="h-12">
                        <TableCell className="font-medium">{s.jobNo}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {s.status}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {s.createdAt
                            ? format(
                                new Date(s.createdAt),
                                locale === 'zh' ? 'MM-dd HH:mm' : 'MMM dd HH:mm'
                              )
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
