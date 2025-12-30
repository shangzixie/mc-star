'use server';

import { getDb } from '@/db';
import { user } from '@/db/schema';
import { adminActionClient } from '@/lib/safe-action';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const deleteUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

/**
 * Admin action to delete a user
 * Only admins can delete users
 * Prevents admins from deleting themselves or other admins
 */
export const adminDeleteUserAction = adminActionClient
  .schema(deleteUserSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const { userId } = parsedInput;
      const adminUser = ctx.user;

      // Prevent admin from deleting themselves
      if (userId === adminUser.id) {
        return {
          success: false,
          error: 'You cannot delete your own account',
        };
      }

      const db = await getDb();

      // Get the user to be deleted
      const targetUser = await db
        .select()
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (targetUser.length === 0) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Prevent deleting other admins
      if (targetUser[0].role === 'admin') {
        return {
          success: false,
          error: 'You cannot delete other admin users',
        };
      }

      // Delete the user (cascade will handle related records)
      await db.delete(user).where(eq(user.id, userId));

      return {
        success: true,
        data: {
          userId,
          email: targetUser[0].email,
        },
      };
    } catch (error) {
      console.error('admin delete user error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete user',
      };
    }
  });

