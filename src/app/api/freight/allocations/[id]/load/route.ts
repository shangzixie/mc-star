import { requireUser } from '@/lib/api/auth';
import { jsonError, jsonOk, parseJson } from '@/lib/api/http';
import { loadAllocationSchema, uuidSchema } from '@/lib/freight/schemas';
import { loadAllocation } from '@/lib/freight/services/allocations';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(request);
    const { id } = await context.params;
    const allocationId = uuidSchema.parse(id);
    const body = await parseJson(request, loadAllocationSchema);

    const updated = await loadAllocation({
      allocationId,
      loadedQty: body.loadedQty,
      containerId: body.containerId,
    });
    return jsonOk({ data: updated });
  } catch (error) {
    return jsonError(error as Error);
  }
}
