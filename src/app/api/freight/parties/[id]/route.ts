import { getDb } from '@/db/index';
import { parties } from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { ApiError, jsonError, jsonOk, parseJson } from '@/lib/api/http';
import { createPartySchema, uuidSchema } from '@/lib/freight/schemas';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

const updatePartySchema = createPartySchema.partial();

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(request);
    const { id } = await context.params;
    const partyId = uuidSchema.parse(id);

    const db = await getDb();
    const [row] = await db
      .select()
      .from(parties)
      .where(eq(parties.id, partyId));
    if (!row) {
      throw new ApiError({
        status: 404,
        code: 'PARTY_NOT_FOUND',
        message: 'Party not found',
      });
    }

    return jsonOk({ data: row });
  } catch (error) {
    return jsonError(error as Error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(request);
    const { id } = await context.params;
    const partyId = uuidSchema.parse(id);
    const body = await parseJson(request, updatePartySchema);

    const db = await getDb();
    const [updated] = await db
      .update(parties)
      .set({
        name: body.name,
        roles: body.roles,
        contactInfo: body.contactInfo as any,
        address: body.address,
        remarks: body.remarks,
        isActive: body.isActive,
        updatedAt: new Date(),
      })
      .where(eq(parties.id, partyId))
      .returning();

    if (!updated) {
      throw new ApiError({
        status: 404,
        code: 'PARTY_NOT_FOUND',
        message: 'Party not found',
      });
    }

    return jsonOk({ data: updated });
  } catch (error) {
    return jsonError(error as Error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(request);
    const { id } = await context.params;
    const partyId = uuidSchema.parse(id);

    const db = await getDb();
    const [updated] = await db
      .update(parties)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(parties.id, partyId))
      .returning();

    if (!updated) {
      throw new ApiError({
        status: 404,
        code: 'PARTY_NOT_FOUND',
        message: 'Party not found',
      });
    }

    return jsonOk({ data: updated });
  } catch (error) {
    return jsonError(error as Error);
  }
}
