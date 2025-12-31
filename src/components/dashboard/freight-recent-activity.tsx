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
import Link from 'next/link';

export function FreightRecentActivity() {
  const receiptsQuery = useFreightWarehouseReceipts({ q: '', status: '' });
  const shipmentsQuery = useFreightShipments({ q: '', status: '' });

  const receipts = (receiptsQuery.data ?? []).slice(0, 6);
  const shipments = (shipmentsQuery.data ?? []).slice(0, 6);

  return (
    <div className="grid gap-4 px-4 lg:px-6 @xl/main:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Inbound Receipts</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/freight/inbound">View all</Link>
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
                    <TableHead>Receipt No</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Inbound</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        No receipts yet.
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
                            ? format(new Date(r.inboundTime), 'MM-dd HH:mm')
                            : r.createdAt
                              ? format(new Date(r.createdAt), 'MM-dd HH:mm')
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
          <CardTitle className="text-base">Recent Shipments</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/freight/shipments">View all</Link>
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
                    <TableHead>Job No</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        No shipments yet.
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
                            ? format(new Date(s.createdAt), 'MM-dd HH:mm')
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


