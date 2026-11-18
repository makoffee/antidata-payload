// Disaster recovery: uploads the local mirror (public/media) into an EMPTY or damaged Blob store,
// using each filename as the key, exactly where Payload looks for it. The database needs no change.
//
//   npm run media:restore                 dry run: shows the target store and what it would upload
//   npm run media:restore -- --apply      actually upload (add --limit 3 to try a few first)
//
// Needs RESTORE_BLOB_TOKEN (a read-write token for the TARGET store) in the environment. It is a
// different variable on purpose: BLOB_READ_WRITE_TOKEN must stay out of local environments.
// It never overwrites a blob that already exists, so it cannot damage a store that is partly intact.
// Verifies the mirror first and refuses to run if any file is missing or the wrong size.
import fs from 'node:fs'
import path from 'node:path'
import { put } from '@vercel/blob'
import { listMedia } from './lib/media-list.mjs'

const apply = process.argv.includes('--apply')
const limitArg = process.argv.indexOf('--limit')
const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity
const token = process.env.RESTORE_BLOB_TOKEN
const dir = path.resolve(process.cwd(), 'public/media')

const listed = await listMedia()
const bad = listed.filter((f) => {
  const file = path.join(dir, f.name)
  return !fs.existsSync(file) || fs.statSync(file).size === 0 || (f.size != null && fs.statSync(file).size !== f.size)
})
if (bad.length) {
  console.error(`Refusing to restore: ${bad.length} files are missing or the wrong size in public/media. Run npm run media:verify.`)
  process.exit(1)
}

// Blob tokens look like vercel_blob_rw_<storeId>_<secret>; show only the store id
const storeId = token?.split('_')[3]
console.log(`Mirror OK: ${listed.length} files. Target store: ${storeId ?? '(RESTORE_BLOB_TOKEN not set)'}`)
if (!apply) {
  console.log('Dry run: nothing uploaded. Re-run with --apply to upload.')
  process.exit(0)
}
if (!token) {
  console.error('Set RESTORE_BLOB_TOKEN to a read-write token for the target store.')
  process.exit(1)
}

const queue = listed.slice(0, limit)
let ok = 0
let existed = 0
let failed = 0
const worker = async () => {
  while (queue.length) {
    const f = queue.shift()
    try {
      await put(f.name, fs.readFileSync(path.join(dir, f.name)), {
        access: 'public',
        addRandomSuffix: false, // the key must stay the filename
        allowOverwrite: false, // never replace something already in the store
        cacheControlMaxAge: 31536000,
        contentType: f.mime,
        token,
      })
      ok++
    } catch (err) {
      if (/already exists/i.test(err.message)) existed++
      else {
        failed++
        console.warn(`  failed ${f.name}: ${err.message}`)
      }
    }
  }
}
await Promise.all(Array.from({ length: 4 }, worker))
console.log(`Done: ${ok} uploaded, ${existed} already there, ${failed} failed.`)
if (failed) process.exit(1)
