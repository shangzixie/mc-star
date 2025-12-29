import { requireUser } from '@/lib/api/auth';
import { jsonError, jsonOk, parseJson } from '@/lib/api/http';
import { shipAllocationSchema, uuidSchema } from '@/lib/freight/schemas';
import { shipAllocation } from '@/lib/freight/services/allocations';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(request);
    const { id } = await context.params;
    const allocationId = uuidSchema.parse(id);
    const body = await parseJson(request, shipAllocationSchema);

    const updated = await shipAllocation({ allocationId, shippedQty: body.shippedQty });
    return jsonOk({ data: updated });
  } catch (error) {
    return jsonError(error as Error);
  }
}


