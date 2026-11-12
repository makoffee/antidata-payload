import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_projects_experience_source" AS ENUM('live', 'figma');
  CREATE TYPE "public"."enum__projects_v_version_experience_source" AS ENUM('live', 'figma');
  ALTER TABLE "projects" ADD COLUMN "experience_source" "enum_projects_experience_source" DEFAULT 'live';
  ALTER TABLE "projects" ADD COLUMN "experience_live_url" varchar;
  ALTER TABLE "projects" ADD COLUMN "experience_figma_url" varchar;
  ALTER TABLE "projects" ADD COLUMN "experience_title" varchar;
  ALTER TABLE "projects" ADD COLUMN "experience_description" varchar;
  ALTER TABLE "_projects_v" ADD COLUMN "version_experience_source" "enum__projects_v_version_experience_source" DEFAULT 'live';
  ALTER TABLE "_projects_v" ADD COLUMN "version_experience_live_url" varchar;
  ALTER TABLE "_projects_v" ADD COLUMN "version_experience_figma_url" varchar;
  ALTER TABLE "_projects_v" ADD COLUMN "version_experience_title" varchar;
  ALTER TABLE "_projects_v" ADD COLUMN "version_experience_description" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects" DROP COLUMN "experience_source";
  ALTER TABLE "projects" DROP COLUMN "experience_live_url";
  ALTER TABLE "projects" DROP COLUMN "experience_figma_url";
  ALTER TABLE "projects" DROP COLUMN "experience_title";
  ALTER TABLE "projects" DROP COLUMN "experience_description";
  ALTER TABLE "_projects_v" DROP COLUMN "version_experience_source";
  ALTER TABLE "_projects_v" DROP COLUMN "version_experience_live_url";
  ALTER TABLE "_projects_v" DROP COLUMN "version_experience_figma_url";
  ALTER TABLE "_projects_v" DROP COLUMN "version_experience_title";
  ALTER TABLE "_projects_v" DROP COLUMN "version_experience_description";
  DROP TYPE "public"."enum_projects_experience_source";
  DROP TYPE "public"."enum__projects_v_version_experience_source";`)
}
