'use server';

import { getDb } from '@/db';
import { invitation, user } from '@/db/schema';
import type { User } from '@/lib/auth-types';
import { adminActionClient } from '@/lib/safe-action';
import { getBaseUrl } from '@/lib/urls/urls';
import { sendEmail } from '@/mail';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * Admin action to invite a user by email
 * Only admins can invite users
 * Creates an invitation token and sends an email
 */
export const adminInviteUserAction = adminActionClient
  .schema(inviteUserSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const { email } = parsedInput;
      const adminUser = (ctx as { user: User }).user;

      const db = await getDb();

      // Check if user already exists
      const existingUser = await db
        .select()
        .from(user)
        .where(eq(user.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        return {
          success: false,
          error: 'User with this email already exists',
        };
      }

      // Check if there's already a pending invitation
      const existingInvitation = await db
        .select()
        .from(invitation)
        .where(eq(invitation.email, email))
        .limit(1);

      if (existingInvitation.length > 0 && !existingInvitation[0].usedAt) {
        return {
          success: false,
          error: 'An invitation has already been sent to this email',
        };
      }

      // Generate invitation token
      const token = nanoid(32);
      const invitationId = nanoid();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Create invitation record
      await db.insert(invitation).values({
        id: invitationId,
        email,
        invitedBy: adminUser.id,
        token,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Send invitation email
      const inviteUrl = `${getBaseUrl()}/auth/register?token=${token}`;
      await sendEmail({
        to: email,
        template: 'inviteUser',
        context: {
          inviteUrl,
          invitedBy: adminUser.name,
        },
      });

      return {
        success: true,
        data: {
          email,
          expiresAt: expiresAt.toISOString(),
        },
      };
    } catch (error) {
      console.error('admin invite user error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to invite user',
      };
    }
  });
