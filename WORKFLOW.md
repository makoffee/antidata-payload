# Working on antidata.net

One environment, one database. The live site is **read-only and static**: pages are built from the
database when Vercel deploys, and nothing on the live site can change content. You edit in the local
admin, then deploy.

| | Where | Database | Media |
|---|---|---|---|
| **Live site** (`main`) | Vercel Hobby, built at deploy time | Neon `main` (read at build; written only by the contact form) | static files in `public/media` |
| **Local** | `npm run dev` | the same Neon `main` database | `public/media` on disk |

On the live deploy `/admin`, `/api/**` and the draft-preview routes are
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
- Dev uses webpack with file polling because the default Turbopack watcher misses in-place saves when the project folder is synced by a cloud-drive app such as Dropbox. If edits stop showing, restart `npm run dev`; restart it after any local `npm run build` too.

## Media (images)

Images are static files in `public/media/` (committed to git, served by Vercel's CDN at `/media/<name>`).
There is no Blob store. The database still stores Payload's `/api/media/file/<name>` path; `getMediaUrl`
turns it into `/media/<name>`, and `/api` is closed on the live site.

- **Add an image:** upload it in the local admin (`npm run dev`). Payload writes the original and its
  generated sizes into `public/media/`. Then `git add public/media`, commit, and push with the content.
  The database row is live as soon as you save it, but the file reaches the live site only with a push,
  so an image used in published content needs the push before the next rebuild shows it.
- **The repo is public.** Everything in `public/media/` is world-readable. Only upload images that are
  meant to be seen (draft-only artwork goes public the moment it is committed).
- **Delete an image:** delete it in the local admin (removes the files from `public/media/`), then commit the deletion.
- `npm run media:verify` checks that every file the database lists is on disk at the recorded size
  (read-only, reads the database). Unused leftovers from the move are in `backups/media-not-in-use/` (git-ignored).
- Images are optimized by Next on first request and cached for a year (`minimumCacheTTL` in `next.config.ts`).
  If Vercel's image-optimization usage gets high, fewer widths (`deviceSizes`) or `unoptimized` are the levers.
