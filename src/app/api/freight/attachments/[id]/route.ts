import { requireUser } from '@/lib/api/auth';
import { jsonError, jsonOk } from '@/lib/api/http';
import { uuidSchema } from '@/lib/freight/schemas';
import { deleteAttachment } from '@/lib/freight/services/attachments';

export const runtime = 'nodejs';

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(request);
    const { id } = await context.params;
    const attachmentId = uuidSchema.parse(id);
    const deleted = await deleteAttachment(attachmentId);
    return jsonOk({ data: deleted });
  } catch (error) {
    return jsonError(error as Error);
  }
}
