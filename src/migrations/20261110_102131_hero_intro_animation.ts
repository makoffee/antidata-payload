import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_hero_animation" AS ENUM('fadeSlide', 'fade', 'none');
  CREATE TYPE "public"."enum__pages_v_version_hero_animation" AS ENUM('fadeSlide', 'fade', 'none');
  ALTER TABLE "pages" ADD COLUMN "hero_animation" "enum_pages_hero_animation" DEFAULT 'fadeSlide';
  ALTER TABLE "_pages_v" ADD COLUMN "version_hero_animation" "enum__pages_v_version_hero_animation" DEFAULT 'fadeSlide';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" DROP COLUMN "hero_animation";
  ALTER TABLE "_pages_v" DROP COLUMN "version_hero_animation";
  DROP TYPE "public"."enum_pages_hero_animation";
  DROP TYPE "public"."enum__pages_v_version_hero_animation";`)
}
