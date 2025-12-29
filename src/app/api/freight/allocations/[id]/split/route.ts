import { requireUser } from '@/lib/api/auth';
import { jsonError, jsonOk, parseJson } from '@/lib/api/http';
import { splitAllocationSchema, uuidSchema } from '@/lib/freight/schemas';
import { splitAllocation } from '@/lib/freight/services/allocations';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(request);
    const { id } = await context.params;
    const allocationId = uuidSchema.parse(id);
    const body = await parseJson(request, splitAllocationSchema);

    const result = await splitAllocation({
      allocationId,
      splitQty: body.splitQty,
      newContainerId: body.newContainerId,
    });
    return jsonOk({ data: result });
  } catch (error) {
    return jsonError(error as Error);
  }
}


