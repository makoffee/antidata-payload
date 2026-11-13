# antidata.net: Payload CMS project rules

Payload 3.80 + Next.js, Neon Postgres, Vercel Blob, Node 24, npm only. Read `WORKFLOW.md` for the day-to-day process.
Generic Payload reference lives in `.cursor/rules/` (collections, fields, hooks, access control, queries, components...). Open the relevant file only when needed. Docs: https://payloadcms.com/docs

## Project-specific rules

- **One shared database and Blob store** serve local dev and production. Anything done locally changes the live site.
- **Never seed, never re-enable `push`** on the db adapter. Schema changes go through migrations only.
- **Schema changes:** ask the user to run `npm run backup` first. Then `npm run migrate:create -- name`, the user runs `npm run migrate`, then `npm run generate:types`. Prefer adding fields. Warn before any rename or removal (it deletes content) and suggest a throwaway Neon branch first.
- A push to `main` runs `payload migrate` in the Vercel build, so a pushed migration is applied to the live DB.
- Claude cannot `git push` or migrate the shared DB. The user runs `! git push origin main` and `! npm run migrate`.
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
