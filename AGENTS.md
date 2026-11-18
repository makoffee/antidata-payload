# antidata.net: Payload CMS project rules

Payload 3.80 + Next.js, Neon Postgres, Vercel Blob, Node 24, npm only. Read `WORKFLOW.md` for the day-to-day process.
Generic Payload reference lives in `.cursor/rules/` (collections, fields, hooks, access control, queries, components...). Open the relevant file only when needed. Docs: https://payloadcms.com/docs

## Git workflow (read first)

- **Work only on the `dev` branch.** Run `git branch --show-current` before committing; if it says `main`, run `git checkout dev` first. Never commit, merge or push to `main`.
- **`main` is production.** The user merges `dev` into `main` by hand, through a GitHub pull request, when they want a production build. Do not open, merge or force that PR yourself.
- `dev` pushes get a Vercel preview deploy (Neon `dev` database). Claude cannot `git push` (no SSH); ask the user to run `! git push origin dev`.
- Git hooks in `.githooks/` block commits and pushes on `main` (`core.hooksPath`, set by `npm install`). Don't bypass them with `ALLOW_MAIN=1` or `--no-verify` unless the user says to.

## Project-specific rules

- **Three environments.** Production (`main` branch) uses Neon `main` + Vercel Blob. Preview (`dev` branch) and local dev both use the Neon `dev` branch; local has no Blob token, so uploads go to disk. Local work does not touch production data. `npm run dev` / `migrate*` refuse to run if `POSTGRES_URL` is the production host (`scripts/check-dev-db.mjs`, `PRODUCTION_DB_HOST`).
- **Never seed, never re-enable `push`** on the db adapter. Schema changes go through migrations only. ("Seed" means the template's demo-content seed, which overwrites real content. Copying media files between storage and `public/media` is not seeding.)
- **Schema changes** (adding fields is preferred; a rename or removal deletes content in whichever DB it runs on, so warn first):
  1. Edit the collection or global.
  2. `npm run migrate:create -- name`, then the user runs `npm run migrate` (applies to the Neon `dev` DB), then `npm run generate:types`.
  3. Test on local and on the `dev` preview.
  4. Before merging the PR, ask the user to create a Neon branch from `main` (production safety net; `npm run backup` only saves the `dev` DB).
  5. Merging to `main` runs the migration on production.
- Every Vercel build runs `payload migrate` (`npm run ci`): previews migrate the Neon `dev` branch, the production build (merge to `main`) migrates production. Preview builds first run the guard and fail if `POSTGRES_URL` is the production host or `PRODUCTION_DB_HOST` is unset.
- Agents cannot `git push` (no SSH key in the sandbox). The user runs `! git push origin dev`, and runs `npm run migrate` (dev DB) too. Agents may commit to `dev` locally.
- Never run `vercel env pull` (it overwrites `.env.local`).
- Scripts that upload media: pass a fresh `context` object on every Local API call. Run locally they write to disk and the `dev` DB (no Blob token). A bulk upload that must reach production Blob needs the user's explicit approval and a temporary token.
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
