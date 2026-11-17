# antidata.net: Payload CMS project rules

Payload 3.80 + Next.js, Neon Postgres, Vercel Blob, Node 24, npm only. Read `WORKFLOW.md` for the day-to-day process.
Generic Payload reference lives in `.cursor/rules/` (collections, fields, hooks, access control, queries, components...). Open the relevant file only when needed. Docs: https://payloadcms.com/docs

## Project-specific rules

- **Three environments.** Production (`main` branch) uses Neon `main` + Vercel Blob. Preview (`dev` branch) and local dev both use the Neon `dev` branch; local has no Blob token, so uploads go to disk. Local work does not touch production data. `npm run dev` / `migrate*` refuse to run if `POSTGRES_URL` is the production host (`scripts/check-dev-db.mjs`, `PRODUCTION_DB_HOST`).
- **Never seed, never re-enable `push`** on the db adapter. Schema changes go through migrations only.
- **Schema changes:** `npm run backup` only saves the `dev` DB. Before merging a PR with a migration, ask the user to create a Neon branch from `main` (production safety net). Then `npm run migrate:create -- name`, the user runs `npm run migrate`, then `npm run generate:types`. Prefer adding fields. Run migrations against the Neon `dev` branch first; production gets them on merge to `main`. Warn before any rename or removal (it deletes content in whichever DB it runs on).
- **Branches:** work on `dev`, never commit or push to `main`. `main` is production (stable); `dev` gets a Vercel preview deploy. The user merges `dev` into `main` via a GitHub pull request when they want a production build. If the checkout is on `main`, `git checkout dev` first.
- Every Vercel build runs `payload migrate` (`npm run ci`): previews migrate the Neon `dev` branch, the production build (merge to `main`) migrates production. Preview builds first run the guard and fail if `POSTGRES_URL` is the production host or `PRODUCTION_DB_HOST` is unset.
- Claude cannot `git push`. The user runs `! git push origin dev`; `npm run migrate` (dev DB) is run by the user too. Claude may commit to `dev` locally.
- Never run `vercel env pull` (it overwrites `.env.local`).
- Scripts that upload media: pass a fresh `context` object on every Local API call, then verify files exist in Blob.
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
