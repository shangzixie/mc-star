'use client';

import { freightFetch } from '@/lib/freight/api-client';
import {
  type FreightAttachment,
  freightAttachmentSchema,
} from '@/lib/freight/api-types';
import { createAttachmentSchema } from '@/lib/freight/schemas';
import { uploadFileFromBrowser } from '@/storage/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { freightKeys } from './query-keys';

const attachmentsArraySchema = z.array(freightAttachmentSchema);

export function useFreightAttachmentsByShipment(shipmentId: string) {
  return useQuery({
    queryKey: freightKeys.attachmentsByShipment(shipmentId),
    enabled: shipmentId.length > 0,
    queryFn: async () =>
      freightFetch(`/api/freight/attachments?shipmentId=${shipmentId}`, {
        schema: attachmentsArraySchema,
      }),
  });
}

export function useCreateFreightAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: z.infer<typeof createAttachmentSchema>) => {
      const body = createAttachmentSchema.parse(input);
      return freightFetch('/api/freight/attachments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        schema: freightAttachmentSchema,
      });
    },
    onSuccess: async (created: FreightAttachment) => {
      await queryClient.invalidateQueries({
        queryKey: freightKeys.attachmentsByShipment(created.shipmentId),
      });
    },
  });
}

export function useUploadFreightAttachment() {
  const createAttachment = useCreateFreightAttachment();

  return useMutation({
    mutationFn: async (input: {
      shipmentId: string;
      file: File;
      folder?: string;
    }) => {
      const uploaded = await uploadFileFromBrowser(
        input.file,
        input.folder ?? `freight/${input.shipmentId}`
      );

      return createAttachment.mutateAsync({
        shipmentId: input.shipmentId,
        fileName: input.file.name,
        fileType: input.file.type || undefined,
        fileUrl: uploaded.url,
        fileSize: input.file.size,
      });
    },
  });
}
