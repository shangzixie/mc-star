'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useFreightAttachmentsByShipment,
  useUploadFreightAttachment,
} from '@/hooks/freight/use-freight-attachments';
import { formatDate } from '@/lib/formatter';
import { getFreightApiErrorMessage } from '@/lib/freight/api-client';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

export function FreightAttachmentsPanel({
  shipmentId,
}: { shipmentId: string }) {
  const t = useTranslations('Dashboard.freight.shipments.detail');
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading, error } =
    useFreightAttachmentsByShipment(shipmentId);
  const upload = useUploadFreightAttachment();

  const onUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      await upload.mutateAsync({ shipmentId, file });
      toast.success(t('attachments.uploaded'));
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('attachments.uploadFailed')
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {t('attachments.description')}
        </div>

        <div className="flex items-center gap-2">
          <Input ref={fileRef} type="file" className="w-full sm:w-[320px]" />
          <Button size="sm" onClick={onUpload} disabled={uploading}>
            {uploading ? t('attachments.uploading') : t('attachments.upload')}
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('attachments.columns.file')}</TableHead>
              <TableHead className="hidden md:table-cell">
                {t('attachments.columns.type')}
              </TableHead>
              <TableHead className="hidden md:table-cell">
                {t('attachments.columns.size')}
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                {t('attachments.columns.createdAt')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <TableRow key={`sk-${idx}`}>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-muted-foreground"
                >
                  {getFreightApiErrorMessage(error)}
                </TableCell>
              </TableRow>
            ) : (data ?? []).length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-muted-foreground"
                >
                  {t('attachments.empty')}
                </TableCell>
              </TableRow>
            ) : (
              (data ?? []).map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    <a
                      href={a.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline-offset-4 hover:underline"
                    >
                      {a.fileName}
                    </a>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {a.fileType || '-'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {typeof a.fileSize === 'number'
                      ? `${Math.round(a.fileSize / 1024)} KB`
                      : '-'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {a.createdAt ? formatDate(new Date(a.createdAt)) : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
