import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects" ADD COLUMN "story_image_id" integer;
  ALTER TABLE "_projects_v" ADD COLUMN "version_story_image_id" integer;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_story_image_id_media_id_fk" FOREIGN KEY ("story_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_story_image_id_media_id_fk" FOREIGN KEY ("version_story_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "projects_story_image_idx" ON "projects" USING btree ("story_image_id");
  CREATE INDEX "_projects_v_version_version_story_image_idx" ON "_projects_v" USING btree ("version_story_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects" DROP CONSTRAINT "projects_story_image_id_media_id_fk";
  
  ALTER TABLE "_projects_v" DROP CONSTRAINT "_projects_v_version_story_image_id_media_id_fk";
  
  DROP INDEX "projects_story_image_idx";
  DROP INDEX "_projects_v_version_version_story_image_idx";
  ALTER TABLE "projects" DROP COLUMN "story_image_id";
  ALTER TABLE "_projects_v" DROP COLUMN "version_story_image_id";`)
}
