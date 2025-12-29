import { getDb } from '@/db/index';
import { attachments } from '@/db/schema';
import { ApiError } from '@/lib/api/http';
import { eq } from 'drizzle-orm';

export async function createAttachment(input: {
  shipmentId: string;
  fileName: string;
  fileType?: string;
  fileUrl: string;
  fileSize?: number;
}) {
  const db = await getDb();

  const [created] = await db
    .insert(attachments)
    .values({
      shipmentId: input.shipmentId,
      fileName: input.fileName,
      fileType: input.fileType,
      fileUrl: input.fileUrl,
      fileSize: input.fileSize,
      uploadedBy: null,
    })
    .returning();

  return created;
}

export async function listAttachmentsByShipment(shipmentId: string) {
  const db = await getDb();
  return db
    .select()
    .from(attachments)
    .where(eq(attachments.shipmentId, shipmentId));
}

export async function deleteAttachment(id: string) {
  const db = await getDb();
  const [deleted] = await db
    .delete(attachments)
    .where(eq(attachments.id, id))
    .returning();

  if (!deleted) {
    throw new ApiError({
      status: 404,
      code: 'ATTACHMENT_NOT_FOUND',
      message: 'Attachment not found',
    });
  }

  return deleted;
}


