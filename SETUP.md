# Setting up a new site from this boilerplate

Goal: production stays stable; `dev` and local can break freely. Free-tier friendly.

## 1. Git
- Branches: `main` (production) and `dev` (day-to-day). Merge `dev` → `main` with a GitHub pull request.
- Optional: GitHub → Settings → Branches → protect `main` (require a pull request).
- Vercel → Settings → Git: production branch is `main`. Other branches get preview deploys.

- `npm install` sets `core.hooksPath=.githooks` (the `prepare` script); the hooks block commits and pushes on `main`.

## 2. Database (Neon, via Vercel Storage)
- Create a Neon database in Vercel Storage and connect it to the project (Production).
- In the Neon console create a branch `dev` from `main`, **Auto-delete: Never**.
- Reset `dev` from `main` any time for fresh data (Branches → `dev` → Reset from parent).

## 3. Environment variables
Vercel → Settings → Environment Variables:

| Variable | Production | Preview |
|---|---|---|
| `POSTGRES_URL` | Neon `main` (pooled) | Neon `dev` (pooled) |
| `PRODUCTION_DB_HOST` | not needed | host fragment of the production string, e.g. `ep-xxxx-xxxx` |
| `BLOB_READ_WRITE_TOKEN` | Blob store token | **leave unset**. Never give Preview the production token: a preview admin could overwrite or delete production media (and its reads would count against the Blob quota). |
| `NEXT_PUBLIC_BLOB_BASE_URL` | `https://<store-id>.public.blob.vercel-storage.com` | same value (previews then show production images read-only, with no token). Leave unset locally. |
| `PAYLOAD_SECRET`, `CRON_SECRET`, `PREVIEW_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `RESEND_API_KEY` | set | set |

Local `.env.local` (copy `.env.example`): `POSTGRES_URL` = Neon `dev`, `PRODUCTION_DB_HOST` = production host fragment, **no** `BLOB_READ_WRITE_TOKEN` (`npm run dev` refuses to start if one is set). Then `npm run sync:media` once to copy the images the database lists into `public/media`.

## 4. Safety checks (already in the repo)
- `scripts/check-dev-db.mjs` runs before `npm run dev` and `npm run migrate*`, and on preview builds (`npm run ci`). It fails if `POSTGRES_URL` is the production host.
- `npm run ci` (Vercel build) runs `payload migrate` then the build: previews migrate `dev`, production migrates `main`.
- No seed, `push: false`: schema changes only through `npm run migrate:create`.

## 5. First run
`npm install`, `npm run dev`, create the first admin user on the `dev` database, then create the same user on the live site.
