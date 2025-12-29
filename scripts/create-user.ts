import dotenv from 'dotenv';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import { getDb } from '../src/db/index.js';

dotenv.config();

type Args = {
  email?: string;
  password?: string;
  name?: string;
  role?: string;
  verified?: boolean;
  dryRun?: boolean;
  help?: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Args = {};

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];

    if (!token?.startsWith('--')) continue;
    const [rawKey, rawValue] = token.split('=');
    const key = rawKey.replace(/^--/, '');
    const value = rawValue ?? argv[i + 1];

    const bumpIfConsumedNext = () => {
      if (!rawKey.includes('=') && value === argv[i + 1]) i++;
    };

    switch (key) {
      case 'help':
      case 'h':
        args.help = true;
        break;
      case 'email':
        args.email = value;
        bumpIfConsumedNext();
        break;
      case 'password':
        args.password = value;
        bumpIfConsumedNext();
        break;
      case 'name':
        args.name = value;
        bumpIfConsumedNext();
        break;
      case 'role':
        args.role = value;
        bumpIfConsumedNext();
        break;
      case 'verified':
        args.verified = value ? value !== 'false' : true;
        bumpIfConsumedNext();
        break;
      case 'unverified':
        args.verified = false;
        break;
      case 'dry-run':
        args.dryRun = true;
        break;
      default:
        // ignore unknown flags
        break;
    }
  }

  return args;
}

function usage() {
  console.log(`
Usage:
  pnpm create-user --email <email> [--name <name>] [--role <role>] [--verified|--unverified] [--dry-run]

Password input (recommended):
  CREATE_USER_PASSWORD='your-password' pnpm create-user --email <email> --name <name>

Alternative (may be saved in shell history):
  pnpm create-user --email <email> --password <password> --name <name>

Notes:
  - Requires DATABASE_URL to point to your Supabase Postgres.
  - By default, the script marks the email as verified so the user can sign in immediately.
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    usage();
    return;
  }

  const email = args.email?.trim().toLowerCase();
  const password = (args.password ?? process.env.CREATE_USER_PASSWORD)?.trim();
  const name = args.name?.trim() ?? 'User';
  const role = args.role?.trim();
  const emailVerified = args.verified ?? true;
  const dryRun = args.dryRun ?? false;

  if (!email) {
    console.error('Missing flag: --email');
    usage();
    process.exit(1);
  }

  if (!password) {
    console.error('Missing password. Provide --password or env CREATE_USER_PASSWORD.');
    usage();
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('Missing env: DATABASE_URL');
    process.exit(1);
  }

  const db = await getDb();

  // Create a minimal Better Auth instance for admin scripting.
  // We intentionally do NOT enable any email sending in this script.
  const auth = betterAuth({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000',
    secret: process.env.BETTER_AUTH_SECRET,
    appName: 'Admin Script',
    database: drizzleAdapter(db, { provider: 'pg' }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [
      admin({
        defaultBanExpiresIn: undefined,
        bannedUserMessage:
          'You have been banned from this application. Please contact support if you believe this is an error.',
      }),
    ],
    user: {
      additionalFields: {
        customerId: { type: 'string', required: false },
      },
    },
  });

  const ctx = (await (auth as any).$context) as any;

  const existing = await ctx.internalAdapter.findUserByEmail(email);
  const existingUser = existing?.user;

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          action: existingUser ? 'update_existing' : 'create_new',
          email,
          name: existingUser ? undefined : name,
          role,
          emailVerified,
        },
        null,
        2
      )
    );
    console.log('Dry run complete.');
    return;
  }

  let user = existingUser;

  if (!user) {
    user = await ctx.internalAdapter.createUser({
      email,
      name,
      emailVerified,
      ...(role ? { role } : {}),
    });
  } else {
    const updates: Record<string, unknown> = {};
    if (emailVerified && user.emailVerified !== true) updates.emailVerified = true;
    if (role && user.role !== role) updates.role = role;
    if (Object.keys(updates).length > 0) {
      user = await ctx.internalAdapter.updateUser(user.id, updates);
    }
  }

  if (!user) {
    throw new Error('Failed to create or update user');
  }

  const passwordHash = await ctx.password.hash(password);
  const accounts = await ctx.internalAdapter.findAccounts(user.id);
  const credentialAccount = accounts.find(
    (a: any) => a.providerId === 'credential'
  );

  if (!credentialAccount) {
    await ctx.internalAdapter.linkAccount({
      userId: user.id,
      providerId: 'credential',
      accountId: user.id,
      password: passwordHash,
    });
  } else {
    await ctx.internalAdapter.updateAccount(credentialAccount.id, {
      password: passwordHash,
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
          role: user.role ?? null,
        },
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error('create-user failed:', err);
  process.exit(1);
});


