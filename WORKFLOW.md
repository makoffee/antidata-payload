# Working on antidata.net

One environment, one database. The live site is **read-only and static**: pages are built from the
database when Vercel deploys, and nothing on the live site can change content. You edit in the local
admin, then deploy.

| | Where | Database | Media |
|---|---|---|---|
| **Live site** (`main`) | Vercel Hobby, built at deploy time | Neon `main` (read at build; written only by the contact form) | Vercel Blob (moving to `public/media`, see below) |
| **Local** | `npm run dev` | the same Neon `main` database | `public/media` on disk |

On the live deploy `/admin`, `/api/**` (except `/api/media/file/**`) and the draft-preview routes are
closed (`next.config.ts`, `LIVE_READ_ONLY`). To reopen them temporarily set `ALLOW_LIVE_ADMIN=1` in Vercel
and redeploy. Preview deploys are off (`vercel.json`).

## Everyday flow

1. `npm run dev`, open `http://localhost:3000/admin`, and edit. **This writes to the real database.**
   Keep unfinished work as a **draft**: only published documents are rendered, and nothing reaches the
   live site until a deploy anyway.
2. Check it on `localhost:3000` (draft preview works locally).
3. Deploy. A push to `main` builds the live site (Vercel runs `payload migrate && next build`).
   For a content-only change there is nothing to commit, so either:
   - `git commit --allow-empty -m "Rebuild" && git push origin main`, or
   - Vercel → Deployments → latest production deploy → **Redeploy**.
4. Code changes: edit, `npm run typecheck`, commit, push to `main`.

Agents can't `git push` (no SSH key in the sandbox); run `! git push origin main` yourself.
Take a `npm run backup` (saves the database to `backups/`, git-ignored) before big content or schema work.

**Node version:** `.nvmrc` and `engines` in `package.json` pin Node 24 for both local and Vercel.
The shell switches automatically when you `cd` into the folder; in an editor terminal that
didn't, run `nvm use`. To upgrade later, change both places together.

## Changing fields or collections (database structure)

There is one database, so a migration you run locally changes the live database immediately, before the
new code is deployed. **Only add fields** (additive changes are harmless to the old code). A rename or
removal deletes content, so take a Neon branch from `main` first.

```bash
npm run migrate:create -- short_description   # writes src/migrations/<date>_short_description.ts
npm run migrate                                # applies it to the database
npm run generate:types
npm run typecheck
```

Commit the migration files with the code. The deploy runs `payload migrate` again (a no-op if already
applied). If a migration fails the build fails and Vercel keeps serving the previous deploy.
Final safety net: Neon point-in-time restore (check the plan's restore window in the dashboard).

## Safety

- Code broken on live? Vercel → Deployments → previous production deploy → *Promote*, or revert the commit. Content is unaffected.
- Use **npm** only (no pnpm/yarn). Don't run `vercel env pull`; it rewrites `.env.local`.
- No seed (the template's seed button was removed because it overwrites real content) and `push: false`: schema changes only through migrations.
- Until media moves to `public/media`, **don't upload images locally**: the file would only exist on your disk while the database row is live.
- Dev uses webpack with file polling because the default Turbopack watcher misses in-place saves when the project folder is synced by a cloud-drive app such as Dropbox. If edits stop showing, restart `npm run dev`; restart it after any local `npm run build` too.

## Blob usage (free plan: 10,000 simple operations a month)

Every image read from Blob that misses a cache counts as a simple operation (a `head()` or a download). Uploads, copies and `list()` are a separate, advanced quota. The limit applies to the whole Blob store (local has no token), and the count resets monthly. The free plan only shows about the last 12 hours of usage: note the number and date now and then, and compare after a few days to get the daily rate.

How media is served: through Payload's own route, `/api/media/file/<name>`, then Next's image optimizer. Since 2026-11-18 the route sends a one-year cache header (`cacheControlMaxAge` in `payload.config.ts`) and Next keeps optimized variants for a year (`minimumCacheTTL` in `next.config.ts`). Before that the header was `max-age=0` (the plugin default, despite what this file used to say), so every request and every optimizer refresh re-read Blob (a `head()` plus a download, 2 simple operations), which used up the free tier and got the store suspended. After a deploy, check `curl -s -o /dev/null -D - https://antidata.net/api/media/file/<name>` for `cache-control: public, max-age=31536000` (use a GET, not `curl -I`: the route answers HEAD with a 404).

- **Direct public Blob URLs for the site, route for the admin.** With `NEXT_PUBLIC_BLOB_BASE_URL` set (`https://<store>.public.blob.vercel-storage.com`), `getMediaUrl` turns `/api/media/file/<name>` into `<base>/<name>`, so visitors and Next's image optimizer read Blob's CDN (an operation only on a CDN miss). Payload's route stays for the admin (thumbnails, previews) and for any URL stored in the database. Do **not** set `disablePayloadAccessControl` on the Blob plugin: it removes that route and broke the live admin on 2026-11-16. The variable is inlined at build, so redeploy after changing it. Leave it unset locally (images come from the `public/media` mirror) and set it for Production in Vercel.
- **Bulk scripts** (imports, site generation): upload each file once and don't re-read it to verify. Try 2 or 3 items first. Resume after a failure from the last good item rather than re-running everything. Avoid `list()` loops.
- **Local dev has no Blob token** (uploads go to disk), so local use costs no Blob operations. The database lists images whose files are only in Blob: run `npm run sync:media` (try `-- --limit 3` first) to copy the missing ones into `public/media` once. It never re-reads files already on disk and never deletes. The old `MEDIA_FALLBACK_ORIGIN` live-site fallback was removed because it spent production Blob operations on every local image view; delete that line from `.env.local` if it is still there. Don't put the production token back in `.env.local`; bulk scripts that must hit Blob need a deliberate, temporary token.
- If the monthly count climbs fast, the next levers are fewer image widths (`deviceSizes` in `next.config.ts`), a lower image quality (now fixed at 100) and fewer resized copies per upload in `src/collections/Media.ts`.

## Media mirror and recovery (if online storage is lost)

`public/media` (git-ignored, inside the Dropbox folder, so it is also copied offsite) is a local copy of every file the database lists. Production's Blob store has no backup of its own.

- `npm run sync:media` copies files that are missing, or the wrong size, from the live site. Never deletes; never touches local-only uploads. Run it after any upload that landed in Blob.
- `npm run media:verify` checks every file the database lists is on disk at the size Payload recorded (read-only; exit 1 on a problem).
- **If the store is lost or blocked:** create a new Blob store, make a read-write token for it, run `npm run media:verify`, then `RESTORE_BLOB_TOKEN=<token> npm run media:restore` (dry run, shows the target store), then add `-- --apply` (try `-- --limit 3` first). It uploads each file under its original filename and never overwrites an existing blob, so the database needs no change. Then set `BLOB_READ_WRITE_TOKEN` on the new store in Vercel (Production) and redeploy. The media base URL is derived from the token, so check images load afterwards. `RESTORE_BLOB_TOKEN` is separate from `BLOB_READ_WRITE_TOKEN` on purpose, so a normal local run never holds a write token.
- The mirror only covers files the database lists.
