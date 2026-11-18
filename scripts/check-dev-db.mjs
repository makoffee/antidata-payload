// Refuses to run when POSTGRES_URL points at the production database.
// Used by `npm run dev`, `npm run migrate*`, and by Vercel preview builds (`npm run ci`).
// Set PRODUCTION_DB_HOST to a fragment of the production Neon host (e.g. ep-example-host-123).
// `--strict` also fails when PRODUCTION_DB_HOST is not set (used on Vercel previews).
// ALLOW_PROD_DB=1 overrides (only for a deliberate one-off against production).

const strict = process.argv.includes('--strict')
const url = process.env.POSTGRES_URL || ''
const prod = (process.env.PRODUCTION_DB_HOST || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

// Storage guard: a local checkout must not hold a Blob write token, or a local upload/delete
// could reach production media. Local uploads go to public/media. (Vercel builds are exempt.)
if (!process.env.VERCEL && process.env.BLOB_READ_WRITE_TOKEN && process.env.ALLOW_LOCAL_BLOB !== '1') {
  console.error(
    '\ncheck-dev-db: BLOB_READ_WRITE_TOKEN is set in this local environment.\n' +
      'Remove it from .env.local / your shell so local uploads stay on disk (see WORKFLOW.md).\n' +
      'Set ALLOW_LOCAL_BLOB=1 to override once (e.g. a deliberate bulk upload).\n',
  )
  process.exit(1)
}

let host = ''
try {
  host = new URL(url).host
} catch {
  console.error('check-dev-db: POSTGRES_URL is missing or not a valid URL.')
  process.exit(1)
}

if (prod.length === 0) {
  if (strict) {
    console.error(
      'check-dev-db: PRODUCTION_DB_HOST is not set, so previews cannot be verified. Set it in Vercel (Preview).',
    )
    process.exit(1)
  }
  console.warn(
    'check-dev-db: PRODUCTION_DB_HOST not set; cannot verify this is not the production database.',
  )
  process.exit(0)
}

if (prod.some((p) => host.includes(p)) && process.env.ALLOW_PROD_DB !== '1') {
  console.error(
    `\ncheck-dev-db: POSTGRES_URL points at the PRODUCTION database (${host}).\n` +
      'Use the dev branch connection string instead (see WORKFLOW.md). Set ALLOW_PROD_DB=1 to override once.\n',
  )
  process.exit(1)
}

// Locally, also refuse if ANY other variable (DATABASE_URL, PGHOST, ...) points at production.
// Skipped with --strict (Vercel previews still carry the integration's unused legacy variables).
const stray = strict
  ? []
  : Object.entries(process.env)
      .filter(
        ([k, v]) =>
          k !== 'PRODUCTION_DB_HOST' &&
          k !== 'POSTGRES_URL' &&
          v &&
          prod.some((p) => v.includes(p)),
      )
      .map(([k]) => k)
if (stray.length > 0 && process.env.ALLOW_PROD_DB !== '1') {
  console.error(
    `\ncheck-dev-db: these variables point at the PRODUCTION database: ${stray.join(', ')}\nRemove them from .env.local (names only shown, values hidden).\n`,
  )
  process.exit(1)
}

console.log(`check-dev-db: OK (${host})`)
