/**
 * Snapshot every collection and global to backups/<timestamp>.json.
 *
 *   npm run backup
 *
 * Read-only: it never writes to the database. Media files themselves live in Vercel Blob
 * and are not copied; the backup keeps their filenames and URLs.
 */
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })

const backup: {
  createdAt: string
  collections: Record<string, unknown[]>
  globals: Record<string, unknown>
} = {
  createdAt: new Date().toISOString(),
  collections: {},
  globals: {},
}

for (const collection of payload.config.collections) {
  // Skip Payload's internal bookkeeping collections (preferences, locks, migrations, jobs)
  if (collection.slug.startsWith('payload-')) continue

  try {
    const { docs } = await payload.find({
      collection: collection.slug,
      depth: 0,
      draft: true,
      pagination: false,
    })
    backup.collections[collection.slug] = docs
    payload.logger.info(`Backed up ${docs.length} ${collection.slug}`)
  } catch (err) {
    // e.g. a collection whose migration hasn't been run yet
    payload.logger.warn(`Skipped ${collection.slug}: ${(err as Error).message}`)
  }
}

for (const global of payload.config.globals) {
  backup.globals[global.slug] = await payload.findGlobal({ slug: global.slug, depth: 0 })
}

const dir = path.resolve(process.cwd(), 'backups')
fs.mkdirSync(dir, { recursive: true })
const file = path.join(dir, `${backup.createdAt.replace(/[:.]/g, '-')}.json`)
fs.writeFileSync(file, JSON.stringify(backup, null, 2))

payload.logger.info(`Backup written to ${path.relative(process.cwd(), file)}`)
process.exit(0)
