# Payload website

A website and CMS built with [Payload](https://payloadcms.com) and Next.js: a Payload admin panel, a content-managed front end, Postgres for data and object storage for media. Originally based on Payload's website template.

## Stack

- Payload 3 and Next.js (App Router), TypeScript, Tailwind CSS
- Postgres (Neon) through Payload's Vercel Postgres adapter
- Vercel Blob for media in production (local disk in development)
- Node 24 (`.nvmrc`), npm only

## Getting started

1. Install Node 24 (`nvm use`) and run `npm install`.
2. Copy `.env.example` to `.env.local` and fill it in. Use a **development** database, never the production one; see [SETUP.md](SETUP.md).
3. Run `npm run migrate` to apply the schema, then `npm run dev`.
4. Open `http://localhost:3000/admin` and create the first admin user.

There is no seed script: it is destructive and has been removed. Create content in the admin.

## How we work

- Work on the `dev` branch; `main` is production. Release by merging a pull request from `dev` into `main`.
- Local development and preview deploys use a development database; only production uses the production database.
- Schema changes go through migrations only (`npm run migrate:create -- name`), never database push.

Details: [WORKFLOW.md](WORKFLOW.md) (day-to-day), [SETUP.md](SETUP.md) (new environment or new site) and [AGENTS.md](AGENTS.md) (rules for AI coding agents).

## Useful scripts

| Command                          | What it does                                                          |
| -------------------------------- | --------------------------------------------------------------------- |
| `npm run dev`                    | Start the dev server (refuses to run against the production database) |
| `npm run typecheck`              | TypeScript check                                                      |
| `npm run migrate:create -- name` | Generate a migration after a schema change                            |
| `npm run migrate`                | Apply migrations to the configured database                           |
| `npm run generate:types`         | Regenerate `payload-types.ts` after schema changes                    |
| `npm run generate:importmap`     | Regenerate the admin import map after editing components              |
| `npm run backup`                 | Export the configured database's content to `backups/` (git-ignored)  |

## Documentation

- [Payload docs](https://payloadcms.com/docs)
- Generic Payload reference notes for agents live in `.cursor/rules/`.

## License

MIT
