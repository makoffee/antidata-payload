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
npm run dev          # http://localhost:3000
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
