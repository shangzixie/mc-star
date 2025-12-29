import { requireUser } from '@/lib/api/auth';
import { jsonError, jsonOk, parseJson } from '@/lib/api/http';
import { pickAllocationSchema, uuidSchema } from '@/lib/freight/schemas';
import { pickAllocation } from '@/lib/freight/services/allocations';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(request);
    const { id } = await context.params;
    const allocationId = uuidSchema.parse(id);
    const body = await parseJson(request, pickAllocationSchema);

    const updated = await pickAllocation({
      allocationId,
      pickedQty: body.pickedQty,
    });
    return jsonOk({ data: updated });
  } catch (error) {
    return jsonError(error as Error);
  }
}
