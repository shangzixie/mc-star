import 'server-only';

import { auth } from '@/lib/auth';
import type { User } from '@/lib/auth-types';
import { ApiError } from './http';

export async function requireUser(request: Request): Promise<User> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    throw new ApiError({
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Unauthorized',
    });
  }

  return session.user as User;
}


