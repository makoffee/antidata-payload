# Working on antidata.net

One database (Neon `main`) and one image store (Vercel Blob) are shared by local and live.
Anything you change in the local admin changes the real site.

## Content (projects, pages, images)

- Edit in the admin: `/admin` on the live site or `localhost:3000/admin`.
- Live-site edits show instantly; local-admin edits reach the live site within ~60 seconds.
- **Projects** live under *Portfolio → Projects*. Drag rows in the list to reorder them on the site.
  Tick **Featured** to show a project in a Projects block (e.g. on the homepage).
- Add a **Projects** block to any page (Content → layout) to show featured, latest or hand-picked projects.

## Code (theme, layout, features)

```bash
git pull
npm run dev          # http://localhost:3000 (webpack + file polling: this folder syncs with Dropbox)
npm run typecheck    # before committing
git add -A && git commit -m "…" && git push   # Vercel deploys main automatically
```

For bigger changes push a separate git branch first; Vercel gives it a preview URL.

**Node version:** `.nvmrc` and `engines` in `package.json` pin Node 24 for both local and Vercel.
The shell switches automatically when you `cd` into the folder; in an editor terminal that
didn't, run `nvm use`. To upgrade later, change both places together.

## Changing fields or collections (database structure)

Dev mode does **not** change the database on its own (`push: false`). After editing a collection:

```bash
npm run migrate:create -- short_description   # writes src/migrations/<date>_short_description.ts
npm run migrate                                # applies it to the shared database
npm run generate:types
```

Commit the migration files with the code. Prefer *adding* fields; renaming or removing a field
deletes the content stored in it.

**Safety protocol for schema changes:**

1. Run `npm run backup` *before* editing the collection (it can't run after, once the code expects columns the DB doesn't have).
2. Adding fields is safe. Before a rename or removal, create a throwaway Neon branch from `main` as a snapshot and note the time.
3. A push to `main` that contains a migration is the point of no return: the Vercel build runs `payload migrate` (`npm run ci`) against the shared database.
4. Final safety net is Neon point-in-time restore (check the plan's restore window in the Neon dashboard).

## Safety

- `npm run backup` saves all content to `backups/<timestamp>.json` (git-ignored).
- Neon keeps 6 hours of history: if content is lost, restore from Neon quickly.
- Code broken on live? Vercel → Deployments → previous deploy → *Promote*. Content is unaffected.
- Use **npm** only (no pnpm/yarn). Don't run `vercel env pull`; it rewrites `.env.local`.
- There is no seed: the template's seed button was removed because it overwrites real content.
- Dev uses webpack with file polling because the default Turbopack watcher misses in-place saves in this Dropbox folder (sed-style replace-saves were seen, normal saves were not). If edits stop showing anyway, restart `npm run dev`; restart it after any local `npm run build` too. `npm run dev` clears `.next` but keeps `.next/cache/images`, so restarts don't re-read every image from Blob.

## Blob usage (free plan: 10,000 simple operations a month)

Every image read from Blob that misses a cache counts as a simple operation (a `head()` or a download). Uploads, copies and `list()` are a separate, advanced quota. The limit is shared by local and live, and the count resets monthly. The free plan only shows about the last 12 hours of usage: note the number and date now and then, and compare after a few days to get the daily rate.

How media is served: through Payload's own route, `/api/media/file/<name>`. It sends a one-year cache header and Vercel's CDN caches it, so repeat views cost nothing. Photos also pass through Next's image optimizer, which caches each size for a year.

- **Do not switch media to direct Blob URLs** (`disablePayloadAccessControl` on the Blob plugin). It removes the route that the admin thumbnails, upload previews and post saves use, and caused 500 errors in the live admin on 2026-11-16. If this is revisited, test on a preview deploy first, with the admin open.
- **Bulk scripts** (imports, site generation): upload each file once and don't re-read it to verify. Try 2 or 3 items first. Resume after a failure from the last good item rather than re-running everything. Avoid `list()` loops.
- **Local dev reads the same store as live.** Reloading admin media pages and restarting dev repeatedly re-reads images, so don't leave bulk-reading scripts running.
- If the monthly count climbs fast, the next levers are fewer image widths (`deviceSizes` in `next.config.ts`), a lower image quality (now fixed at 100) and fewer resized copies per upload in `src/collections/Media.ts`.
