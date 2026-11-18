// Lists every media file the database references (originals + generated sizes) with the size and
// type Payload recorded for it. Shared by sync-media, media-verify and media-restore.
import pg from 'pg'

export const listMedia = async () => {
  const client = new pg.Client({ connectionString: process.env.POSTGRES_URL })
  await client.connect()
  try {
    const cols = (
      await client.query(
        `select column_name from information_schema.columns
         where table_name = 'media' and column_name ~ '(^|_)(filename|filesize|mime_type)$'`,
      )
    ).rows.map((r) => r.column_name)
    const rows = (await client.query(`select ${cols.map((c) => `"${c}"`).join(', ')} from media`)).rows

    // Group columns by variant: '' for the original, 'sizes_large_' for a generated size, etc.
    const prefixes = [...new Set(cols.filter((c) => c.endsWith('filename')).map((c) => c.replace(/filename$/, '')))]
    const files = new Map()
    for (const row of rows) {
      for (const p of prefixes) {
        const name = row[`${p}filename`]
        if (!name) continue
        files.set(name, {
          name,
          size: row[`${p}filesize`] != null ? Number(row[`${p}filesize`]) : null,
          mime: row[`${p}mime_type`] || 'application/octet-stream',
        })
      }
    }
    return [...files.values()].sort((a, b) => a.name.localeCompare(b.name))
  } finally {
    await client.end()
  }
}
