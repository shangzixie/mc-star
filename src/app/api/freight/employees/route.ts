import { getDb } from '@/db/index';
import { employees } from '@/db/schema';
import { requireUser } from '@/lib/api/auth';
import { jsonError, jsonOk } from '@/lib/api/http';
import { ilike } from 'drizzle-orm';

export const runtime = 'nodejs';

/**
 * GET /api/freight/employees
 * Query params:
 *   - q: search term (fuzzy search on fullName)
 */
export async function GET(request: Request) {
  try {
    await requireUser(request);
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.trim();

    const db = await getDb();
    
    // Fuzzy search on fullName if query provided
    const rows =
      q && q.length > 0
        ? await db
            .select()
            .from(employees)
            .where(ilike(employees.fullName, `%${q}%`))
            .orderBy(employees.fullName)
        : await db.select().from(employees).orderBy(employees.fullName);

    return jsonOk({ data: rows });
  } catch (error) {
    return jsonError(error as Error);
  }
}

