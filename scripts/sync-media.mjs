// Copies media files that are missing from public/media (the local upload folder) from the live
// site, so local dev shows every image the dev database lists. Run: npm run sync:media
//
// Why: the dev database is a copy of production, but the image files live only in Vercel Blob.
// This reads each file ONCE, and never again once it is on disk, so local browsing costs no Blob
// operations after that. It never deletes anything, so locally uploaded files are kept.
// Re-run it after resetting the Neon dev branch from main (new rows can reference new files).
//
//   npm run sync:media -- --limit 3   try a few first
//   npm run sync:media                everything that is missing
//
// Set SYNC_MEDIA_ORIGIN to read from somewhere other than https://antidata.net.

import fs from 'node:fs'
import path from 'node:path'
import pg from 'pg'

const origin = (process.env.SYNC_MEDIA_ORIGIN || 'https://antidata.net').replace(/\/$/, '')
const limitArg = process.argv.indexOf('--limit')
const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity
const outDir = path.resolve(process.cwd(), 'public/media')
fs.mkdirSync(outDir, { recursive: true })

const client = new pg.Client({ connectionString: process.env.POSTGRES_URL })
await client.connect()
const cols = (
  await client.query(
    `select column_name from information_schema.columns
     where table_name = 'media' and (column_name = 'filename' or column_name like 'sizes\\_%\\_filename')`,
  )
).rows.map((r) => r.column_name)
const rows = (await client.query(`select ${cols.map((c) => `"${c}"`).join(', ')} from media`)).rows
await client.end()

const names = [...new Set(rows.flatMap((r) => Object.values(r)).filter(Boolean))]
const allMissing = names.filter((n) => !fs.existsSync(path.join(outDir, n)))
const missing = allMissing.slice(0, limit)
console.log(`${names.length} files listed, ${names.length - allMissing.length} already on disk, ${allMissing.length} missing; fetching ${missing.length} from ${origin}`)

let ok = 0
let failed = 0
let blockedInARow = 0
const queue = [...missing]

const worker = async () => {
  while (queue.length && blockedInARow < 5) {
    const name = queue.shift()
    try {
      const res = await fetch(`${origin}/api/media/file/${encodeURIComponent(name)}`)
      const buf = res.status === 200 ? Buffer.from(await res.arrayBuffer()) : null
      if (buf && buf.length > 0) {
        fs.writeFileSync(path.join(outDir, name), buf)
        ok++
        blockedInARow = 0
      } else {
        failed++
        // An empty 204 means the Blob store is not serving (suspended or over quota)
        if (res.status === 204) blockedInARow++
        console.warn(`  skipped ${name} (HTTP ${res.status})`)
      }
    } catch (err) {
      failed++
      console.warn(`  failed ${name}: ${err.message}`)
    }
  }
}
await Promise.all(Array.from({ length: 4 }, worker))

if (blockedInARow >= 5) console.error('Stopped: 5 empty responses in a row. The Blob store is probably still blocked.')
console.log(`Done: ${ok} copied, ${failed} skipped or failed.`)
