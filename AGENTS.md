# antidata.net: Payload CMS project rules

Payload 3.94 + Next.js 16, Neon Postgres, Vercel Blob (moving to `public/media`), Node 24, npm only. Read `WORKFLOW.md` for the day-to-day process.
Generic Payload reference lives in `.cursor/rules/` (collections, fields, hooks, access control, queries, components...). Open the relevant file only when needed. Docs: https://payloadcms.com/docs

## Git workflow (read first)

- **Single-person site, one branch.** Commit to `main`. No preview deploys (`vercel.json`), so there is no `dev` workflow.
- Claude cannot `git push` (no SSH); ask the user to run `! git push origin main`. A push to `main` builds the live site, so don't push or merge on your own.
- Never run `vercel env pull` (it overwrites `.env.local`).

## Project-specific rules

- **The live site is read-only and static.** Content is edited only in the local admin (`npm run dev`), which writes to the one Neon database. The live deploy closes `/admin`, `/api/**` (except `/api/media/file/**`) and the preview routes (`LIVE_READ_ONLY` in `next.config.ts`). Pages are built at deploy time and revalidate only on publish; do not add `revalidate = N` timers, crons or anything that wakes the database on a schedule. Neon compute is the thing to protect.
- **Local dev uses the production database.** Treat every local write as live data. Take `npm run backup` before bulk work.
- **Never seed, never re-enable `push`** on the db adapter. Schema changes go through migrations only. ("Seed" means the template's demo-content seed, which overwrites real content.)
- **Schema changes:** only add fields (a rename or removal deletes content, warn first and ask for a Neon branch from `main`). Edit the collection, `npm run migrate:create -- name`, the user runs `npm run migrate`, then `npm run generate:types` and `npm run typecheck`. The deploy runs `payload migrate` too.
- Scripts that upload media: pass a fresh `context` object on every Local API call. Local uploads go to `public/media` (no Blob token locally). Don't upload until media is moved to `public/media`; a bulk upload to Blob needs the user's explicit approval and a temporary token.
- After editing components run `npm run generate:importmap`. After schema changes run `npm run generate:types`. Validate with `npm run typecheck`.

## Payload security rules (always)

1. Local API bypasses access control by default. When passing `user`, ALWAYS set `overrideAccess: false`.
2. In hooks, ALWAYS pass `req` to nested operations (keeps the same transaction).
3. Prevent hook loops with a `context` flag (e.g. `context.skipHooks`).
4. Field-level access returns booleans only (no query constraints).
5. Default to restrictive access. Check that roles exist before changing access on a collection or global.
6. Custom endpoints must check `req.user` first.
7. Use `select`, `depth: 0` and indexes to keep queries light.
8. Import types from `payload-types.ts`; run `generate:types` after schema changes.
