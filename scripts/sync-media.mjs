// Copies media files that are missing from public/media (the local upload folder) from the live
// site, so local dev shows every image the dev database lists. Run: npm run sync:media
//
// Why: the dev database is a copy of production, but the image files live only in Vercel Blob.
// This reads each file ONCE, and never again once it is on disk, so local browsing costs no Blob
// operations after that. It never deletes anything and never touches files the database does not
// list, so locally uploaded files are kept. A listed file that is the wrong size is re-fetched.
// Re-run it after resetting the Neon dev branch from main (new rows can reference new files).
//
//   npm run sync:media -- --limit 3   try a few first
//   npm run sync:media                everything that is missing
//
// Set SYNC_MEDIA_ORIGIN to read from somewhere other than https://antidata.net.

import fs from 'node:fs'
import path from 'node:path'
import { listMedia } from './lib/media-list.mjs'

const origin = (process.env.SYNC_MEDIA_ORIGIN || 'https://antidata.net').replace(/\/$/, '')
const limitArg = process.argv.indexOf('--limit')
const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity
const outDir = path.resolve(process.cwd(), 'public/media')
fs.mkdirSync(outDir, { recursive: true })

const listed = await listMedia()
const names = listed.map((f) => f.name)
// Missing, or on disk at a size that differs from what Payload recorded (e.g. a saved error page):
// both are fetched again. Anything not listed in the database (local uploads) is never touched.
const isGood = (f) => {
  const file = path.join(outDir, f.name)
  if (!fs.existsSync(file)) return false
  const size = fs.statSync(file).size
  return size > 0 && (f.size == null || size === f.size)
}
const allMissing = listed.filter((f) => !isGood(f)).map((f) => f.name)
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
