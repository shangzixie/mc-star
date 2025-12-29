import { requireUser } from '@/lib/api/auth';
import { jsonError, jsonOk } from '@/lib/api/http';
import { uuidSchema } from '@/lib/freight/schemas';
import { cancelAllocation } from '@/lib/freight/services/allocations';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(request);
    const { id } = await context.params;
    const allocationId = uuidSchema.parse(id);

    const updated = await cancelAllocation({ allocationId });
    return jsonOk({ data: updated });
  } catch (error) {
    return jsonError(error as Error);
  }
}


