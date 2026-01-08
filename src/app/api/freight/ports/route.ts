import { getDb } from '@/db/index';
import { transportNodes } from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { jsonError, jsonOk } from '@/lib/api/http';
import { and, ilike, or } from 'drizzle-orm';

export const runtime = 'nodejs';

/**
 * GET /api/freight/ports
 * Get ports/transport nodes by search query
 */
export async function GET(request: Request) {
  try {
    await requireUser(request);
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';

    const db = await getDb();

    const base = db.select().from(transportNodes);

    const searchClause =
      q && q.length > 0
        ? or(
            ilike(transportNodes.nameCn, `%${q}%`),
            ilike(transportNodes.nameEn || '', `%${q}%`),
            ilike(transportNodes.unLocode || '', `%${q}%`)
          )
        : undefined;

    const ports = searchClause
      ? await base.where(searchClause).limit(20)
      : await base.limit(20);

    return jsonOk({ data: ports });
  } catch (error) {
    return jsonError(error as Error);
  }
}
