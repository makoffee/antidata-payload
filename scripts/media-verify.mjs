// Checks that public/media holds every file the database lists, at the size Payload recorded.
// Read-only. Exits 1 on any missing or wrong-size file. Run: npm run media:verify
import fs from 'node:fs'
import path from 'node:path'
import { listMedia } from './lib/media-list.mjs'

const dir = path.resolve(process.cwd(), 'public/media')
const listed = await listMedia()
const missing = []
const wrongSize = []
for (const f of listed) {
  const file = path.join(dir, f.name)
  if (!fs.existsSync(file)) {
    missing.push(f.name)
    continue
  }
  const size = fs.statSync(file).size
  if (size === 0 || (f.size != null && size !== f.size)) wrongSize.push(`${f.name} (disk ${size}, database ${f.size})`)
}
const known = new Set(listed.map((f) => f.name))
const extra = fs.existsSync(dir) ? fs.readdirSync(dir).filter((n) => !known.has(n) && !n.startsWith('.')) : []

console.log(`Database lists ${listed.length} files; ${listed.length - missing.length} on disk in public/media.`)
if (missing.length) console.log(`MISSING (${missing.length}): ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? ', …' : ''}`)
if (wrongSize.length) console.log(`WRONG SIZE (${wrongSize.length}): ${wrongSize.slice(0, 10).join('; ')}${wrongSize.length > 10 ? '; …' : ''}`)
if (extra.length) console.log(`Not in the database (local uploads or leftovers, left alone): ${extra.length}`)
if (missing.length || wrongSize.length) {
  console.log('Fix with: npm run sync:media (re-download missing files; delete a wrong-size file first).')
  process.exit(1)
}
console.log('OK: every listed file is present at its recorded size.')
