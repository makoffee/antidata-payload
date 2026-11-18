# Working on antidata.net

Three environments:

| | Code | Database | Media |
|---|---|---|---|
| **Production** | Vercel, `main` branch | Neon `main` | Vercel Blob |
| **Preview** | Vercel, `dev` branch | Neon `dev` | none (no Blob token, by design); uploaded images do not show |
| **Local** | `npm run dev` | Neon `dev` (same as preview) | `public/media` on disk, filled by `npm run sync:media` |

Local and preview never touch production data. `npm run dev` and `npm run migrate*` refuse to run
if `POSTGRES_URL` is the production host (`PRODUCTION_DB_HOST`, checked by `scripts/check-dev-db.mjs`).
Real content is edited in the live admin (`antidata.net/admin`). Local/preview content is throwaway:
reset the Neon `dev` branch from `main` whenever you want fresh data (Neon → Branches → `dev` → Reset from parent).
Local has no Blob token (`npm run dev` refuses to start if one is set). The dev database lists production's images but their files live only in Blob, so run `npm run sync:media` to copy them into `public/media` once; uploads you make locally stay on disk and are never sent to production.

## Content (projects, pages, images)

- Edit in the admin: `/admin` on the live site or `localhost:3000/admin`.
- Edit real content on the live site. Local-admin edits only change the `dev` database.
- **Projects** live under *Portfolio → Projects*. Drag rows in the list to reorder them on the site.
  Tick **Featured** to show a project in a Projects block (e.g. on the homepage).
- Add a **Projects** block to any page (Content → layout) to show featured, latest or hand-picked projects.

## Code (theme, layout, features)

```bash
git checkout dev && git pull
npm run dev          # http://localhost:3000 (webpack + file polling, see Safety below)
npm run typecheck    # before committing
git add -A && git commit -m "…" && git push origin dev   # Vercel builds a preview of dev
```

**Branches:** `main` is production and only changes through a pull request. Day-to-day work happens on `dev`.

1. Commit and push to `dev`. Vercel builds a preview deploy (Vercel → Deployments, or the link on the GitHub PR/commit).
2. Check the preview. Keep pushing fixes to `dev` as needed.
3. When happy, open a pull request `dev` → `main` on GitHub and merge it. The merge triggers the production build.
4. Afterwards, sync locally: `git checkout dev && git pull && git merge origin/main` (only needed if `main` got commits that `dev` lacks, e.g. a GitHub merge commit) and `git push origin dev`.

Don't commit directly to `main`. For a larger experiment, branch off `dev` (`git checkout -b feature/name`) and open a PR into `dev`.

Previews use the Neon `dev` database, so they never change production content.

**Node version:** `.nvmrc` and `engines` in `package.json` pin Node 24 for both local and Vercel.
The shell switches automatically when you `cd` into the folder; in an editor terminal that
didn't, run `nvm use`. To upgrade later, change both places together.

## Changing fields or collections (database structure)

Dev mode does **not** change the database on its own (`push: false`). After editing a collection:

```bash
npm run migrate:create -- short_description   # writes src/migrations/<date>_short_description.ts
npm run migrate                                # applies it to the Neon dev branch
npm run generate:types
```

Commit the migration files with the code. Prefer *adding* fields; renaming or removing a field
deletes the content stored in it.

**Safety protocol for schema changes:**

1. `npm run backup` now saves the **`dev`** database, not production. Run it before editing a collection if the `dev` content matters. The real production safety net is a Neon branch: just before merging a PR that carries a migration, create a branch from `main` in Neon (name it e.g. `pre-<date>`, expiry 7 days) and note the time for point-in-time restore. Delete it once the release looks good.
2. Adding fields is safe. Renames and removals delete content in the database they run on: try them on `dev` first, and note the time before the production merge.
3. Test first on `dev`: `npm run migrate` locally migrates the Neon `dev` branch, and the preview build migrates it too. Merging `dev` into `main` runs `payload migrate` (`npm run ci`) on production. That merge is the point of no return. Preview builds abort if `POSTGRES_URL` is the production host or `PRODUCTION_DB_HOST` is unset.
4. Final safety net is Neon point-in-time restore (check the plan's restore window in the Neon dashboard).

## Safety

- `npm run backup` saves the database it is pointed at (local: the `dev` branch) to `backups/<timestamp>.json` (git-ignored). It does not back up production.
- Production recovery: a Neon branch from `main` before risky merges, and Neon point-in-time restore (about 6 hours of history on the free plan): restore quickly if content is lost.
- Code broken on live? Vercel → Deployments → previous production deploy → *Promote* (or revert the merge commit on `main`). Content is unaffected.
- Use **npm** only (no pnpm/yarn). Don't run `vercel env pull`; it rewrites `.env.local`.
- There is no seed: the template's seed button was removed because it overwrites real content.
- Blob usage (below) is only production's (Preview has no token). Local uploads go to disk.
- Dev uses webpack with file polling because the default Turbopack watcher misses in-place saves when the project folder is synced by a cloud-drive app such as Dropbox (only needed in that setup; sed-style replace-saves were seen, normal saves were not). If edits stop showing anyway, restart `npm run dev`; restart it after any local `npm run build` too. `npm run dev` clears `.next` but keeps `.next/cache/images`, so restarts don't re-read every image from Blob.

## Blob usage (free plan: 10,000 simple operations a month)

Every image read from Blob that misses a cache counts as a simple operation (a `head()` or a download). Uploads, copies and `list()` are a separate, advanced quota. The limit applies to the whole Blob store (production only: previews and local have no token), and the count resets monthly. The free plan only shows about the last 12 hours of usage: note the number and date now and then, and compare after a few days to get the daily rate.

How media is served: through Payload's own route, `/api/media/file/<name>`, then Next's image optimizer. Since 2026-11-18 the route sends a one-year cache header (`cacheControlMaxAge` in `payload.config.ts`) and Next keeps optimized variants for a year (`minimumCacheTTL` in `next.config.ts`). Before that the header was `max-age=0` (the plugin default, despite what this file used to say), so every request and every optimizer refresh re-read Blob (a `head()` plus a download, 2 simple operations), which used up the free tier and got the store suspended. After a deploy, check `curl -s -o /dev/null -D - https://antidata.net/api/media/file/<name>` for `cache-control: public, max-age=31536000` (use a GET, not `curl -I`: the route answers HEAD with a 404).

- **Do not switch media to direct Blob URLs** (`disablePayloadAccessControl` on the Blob plugin). It removes the route that the admin thumbnails, upload previews and post saves use, and caused 500 errors in the live admin on 2026-11-16. If this is revisited, test on a preview deploy first, with the admin open.
- **Bulk scripts** (imports, site generation): upload each file once and don't re-read it to verify. Try 2 or 3 items first. Resume after a failure from the last good item rather than re-running everything. Avoid `list()` loops.
- **Local dev has no Blob token** (uploads go to disk), so local use costs no Blob operations. The dev database lists production's images but their files are only in Blob: run `npm run sync:media` (try `-- --limit 3` first) to copy the missing ones into `public/media` once. It never re-reads files already on disk and never deletes. Re-run after resetting the Neon `dev` branch from `main`. The old `MEDIA_FALLBACK_ORIGIN` live-site fallback was removed because it spent production Blob operations on every local image view; delete that line from `.env.local` if it is still there. Don't put the production token back in `.env.local`; bulk scripts that must hit Blob need a deliberate, temporary token.
- If the monthly count climbs fast, the next levers are fewer image widths (`deviceSizes` in `next.config.ts`), a lower image quality (now fixed at 100) and fewer resized copies per upload in `src/collections/Media.ts`.
