import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_logo_wall_logos" ADD COLUMN "logo_dark_id" integer;
  ALTER TABLE "_pages_v_blocks_logo_wall_logos" ADD COLUMN "logo_dark_id" integer;
  ALTER TABLE "pages_blocks_logo_wall_logos" ADD CONSTRAINT "pages_blocks_logo_wall_logos_logo_dark_id_media_id_fk" FOREIGN KEY ("logo_dark_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_logo_wall_logos" ADD CONSTRAINT "_pages_v_blocks_logo_wall_logos_logo_dark_id_media_id_fk" FOREIGN KEY ("logo_dark_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_blocks_logo_wall_logos_logo_dark_idx" ON "pages_blocks_logo_wall_logos" USING btree ("logo_dark_id");
  CREATE INDEX "_pages_v_blocks_logo_wall_logos_logo_dark_idx" ON "_pages_v_blocks_logo_wall_logos" USING btree ("logo_dark_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_logo_wall_logos" DROP CONSTRAINT "pages_blocks_logo_wall_logos_logo_dark_id_media_id_fk";
  
  ALTER TABLE "_pages_v_blocks_logo_wall_logos" DROP CONSTRAINT "_pages_v_blocks_logo_wall_logos_logo_dark_id_media_id_fk";
  
  DROP INDEX "pages_blocks_logo_wall_logos_logo_dark_idx";
  DROP INDEX "_pages_v_blocks_logo_wall_logos_logo_dark_idx";
  ALTER TABLE "pages_blocks_logo_wall_logos" DROP COLUMN "logo_dark_id";
  ALTER TABLE "_pages_v_blocks_logo_wall_logos" DROP COLUMN "logo_dark_id";`)
}
