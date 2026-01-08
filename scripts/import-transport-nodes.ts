import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';

type Args = {
  file?: string;
  chunkSize: number;
  dryRun: boolean;
  help: boolean;
};

type SourceRow = {
  id?: number;
  companyId?: number | null;
  type?: number;
  name?: string;
  code?: string;
  region?: string | null;
  countryCode?: string | null;
  postCode?: string | null;
};

const TYPE_MAP: Record<number, string> = {
  1: 'SEA',
  2: 'ROAD',
  3: 'AIR',
};

function parseArgs(argv: string[]): Args {
  const args: Args = {
    chunkSize: 500,
    dryRun: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token) continue;

    if (token === '--help' || token === '-h') {
      args.help = true;
      continue;
    }

    if (token === '--dry-run') {
      args.dryRun = true;
      continue;
    }

    if (token.startsWith('--chunk-size=')) {
      const value = token.split('=')[1];
      const n = Number(value);
      if (Number.isFinite(n) && n > 0) args.chunkSize = Math.floor(n);
      continue;
    }

    if (token === '--chunk-size') {
      const value = argv[i + 1];
      const n = Number(value);
      if (Number.isFinite(n) && n > 0) args.chunkSize = Math.floor(n);
      i++;
      continue;
    }

    if (token.startsWith('--file=')) {
      args.file = token.split('=')[1];
      continue;
    }

    if (token === '--file') {
      args.file = argv[i + 1];
      i++;
      continue;
    }

    // First positional arg = file
    if (!args.file && !token.startsWith('-')) {
      args.file = token;
    }
  }

  return args;
}

function printHelp() {
  // eslint-disable-next-line no-console
  console.log(
    `
Import transport nodes JSON into Postgres (upsert by un_locode).

Usage:
  pnpm tsx scripts/import-transport-nodes.ts --file docs/transport_nodes_info.json

Options:
  --file <path>         Path to JSON file (array of objects)
  --chunk-size <n>      Batch size (default: 500)
  --dry-run             Parse + report stats, do not write
  -h, --help            Show help
`.trim()
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.file) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const filePath = path.isAbsolute(args.file)
    ? args.file
    : path.join(process.cwd(), args.file);

  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error('JSON must be an array');
  }

  const sourceRows = parsed as SourceRow[];

  const rowsRaw = sourceRows
    .map((r) => {
      const code = (r.code ?? '').toString().trim().toUpperCase();
      const name = (r.name ?? '').toString().trim();
      const countryCode = r.countryCode
        ? r.countryCode.toString().trim().toUpperCase().slice(0, 2)
        : null;
      const type =
        typeof r.type === 'number' ? (TYPE_MAP[r.type] ?? null) : null;

      return {
        un_locode: code || null,
        name_cn: name || code || 'UNKNOWN',
        name_en: name || null,
        country_code: countryCode,
        type,
      };
    })
    .filter((r) => !!r.un_locode);

  // De-dupe by un_locode to avoid:
  // "ON CONFLICT DO UPDATE command cannot affect row a second time"
  // which happens when the same key appears more than once in a single INSERT.
  const deduped = new Map<string, (typeof rowsRaw)[number]>();
  for (const row of rowsRaw) {
    deduped.set(row.un_locode as string, row);
  }
  const rows = Array.from(deduped.values());
  const duplicateUnLocodeCount = rowsRaw.length - rows.length;

  const longCodes = rows.filter((r) => (r.un_locode?.length ?? 0) > 10);

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        file: filePath,
        total: sourceRows.length,
        toUpsert: rows.length,
        duplicateUnLocodeCount,
        dryRun: args.dryRun,
        chunkSize: args.chunkSize,
        typeCounts: rows.reduce<Record<string, number>>((acc, r) => {
          const key = r.type ?? 'UNKNOWN';
          acc[key] = (acc[key] ?? 0) + 1;
          return acc;
        }, {}),
        longCodeCount: longCodes.length,
      },
      null,
      2
    )
  );

  if (args.dryRun) return;
  if (longCodes.length > 0) {
    throw new Error(
      `Found ${longCodes.length} codes longer than 10 characters; widen un_locode or clean the data first.`
    );
  }

  const sql = postgres(connectionString, { prepare: false });
  try {
    for (let i = 0; i < rows.length; i += args.chunkSize) {
      const chunk = rows.slice(i, i + args.chunkSize);
      await sql`
        insert into transport_nodes ${sql(
          chunk,
          'un_locode',
          'name_cn',
          'name_en',
          'country_code',
          'type'
        )}
        on conflict (un_locode) do update set
          name_cn = excluded.name_cn,
          name_en = excluded.name_en,
          country_code = excluded.country_code,
          type = excluded.type
      `;
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
