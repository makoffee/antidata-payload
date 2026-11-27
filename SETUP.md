# Setting up this site

Goal: a static portfolio on Vercel Hobby with near-zero cost. One Neon database, edited only locally.

## 1. Git and Vercel
- One branch, `main`. Vercel → Settings → Git: production branch is `main`.
- `vercel.json` turns off preview deploys for `dev` (`git.deploymentEnabled`). Don't enable previews: they would build against the single database.

## 2. Database (Neon, via Vercel Storage)
- One Neon database connected to the project (Production). Keep it on the free plan; it suspends when idle.
- Before risky schema work create a Neon branch from `main` (set an expiry) as a safety net, and delete it afterwards.

## 3. Environment variables
| Variable | Production (Vercel) | Local `.env.local` |
|---|---|---|
| `POSTGRES_URL` | Neon `main` (pooled) | the same string |
| `PAYLOAD_SECRET`, `PREVIEW_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `RESEND_API_KEY` | set | set |

`CRON_SECRET`, `PRODUCTION_DB_HOST`, `BLOB_READ_WRITE_TOKEN` and `NEXT_PUBLIC_BLOB_BASE_URL` are no longer used and can be removed from Vercel.

## 4. Safety (already in the repo)
- `next.config.ts` closes `/admin`, `/api/**` and the preview routes on the production deploy (`ALLOW_LIVE_ADMIN=1` reopens them).
- `npm run ci` (Vercel build) runs `payload migrate` then the build.
- No seed, `push: false`: schema changes only through `npm run migrate:create`.

## 5. First run
`npm install`, `npm run dev`, create the first admin user locally (it is stored in the shared database).
