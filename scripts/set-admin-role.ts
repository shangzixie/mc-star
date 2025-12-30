import { getDb } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Script to set a user's role to admin
 * Usage: tsx scripts/set-admin-role.ts <email>
 */
async function setAdminRole() {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: tsx scripts/set-admin-role.ts <email>');
    process.exit(1);
  }

  try {
    const db = await getDb();

    // Find user by email
    const users = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (users.length === 0) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }

    const targetUser = users[0];

    if (targetUser.role === 'admin') {
      console.log(`User ${email} is already an admin`);
      process.exit(0);
    }

    // Update user role to admin
    await db
      .update(user)
      .set({ role: 'admin', updatedAt: new Date() })
      .where(eq(user.id, targetUser.id));

    console.log(`✓ Successfully set user ${email} as admin`);
  } catch (error) {
    console.error('Error setting admin role:', error);
    process.exit(1);
  }
}

setAdminRole();
