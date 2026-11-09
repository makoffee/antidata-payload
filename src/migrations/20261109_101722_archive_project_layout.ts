import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_archive_project_layout" AS ENUM('grid', 'stories');
  CREATE TYPE "public"."enum__pages_v_blocks_archive_project_layout" AS ENUM('grid', 'stories');
  ALTER TABLE "pages_blocks_archive" ADD COLUMN "project_layout" "enum_pages_blocks_archive_project_layout" DEFAULT 'grid';
  ALTER TABLE "pages_blocks_archive" ADD COLUMN "show_view_all" boolean DEFAULT false;
  ALTER TABLE "_pages_v_blocks_archive" ADD COLUMN "project_layout" "enum__pages_v_blocks_archive_project_layout" DEFAULT 'grid';
  ALTER TABLE "_pages_v_blocks_archive" ADD COLUMN "show_view_all" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_archive" DROP COLUMN "project_layout";
  ALTER TABLE "pages_blocks_archive" DROP COLUMN "show_view_all";
  ALTER TABLE "_pages_v_blocks_archive" DROP COLUMN "project_layout";
  ALTER TABLE "_pages_v_blocks_archive" DROP COLUMN "show_view_all";
  DROP TYPE "public"."enum_pages_blocks_archive_project_layout";
  DROP TYPE "public"."enum__pages_v_blocks_archive_project_layout";`)
}
