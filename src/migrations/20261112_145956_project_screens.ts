import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "projects_screens_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"image_id" integer
  );
  
  CREATE TABLE "_projects_v_version_screens_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  ALTER TABLE "projects" ADD COLUMN "screens_heading" varchar;
  ALTER TABLE "projects" ADD COLUMN "screens_background_image_id" integer;
  ALTER TABLE "projects" ADD COLUMN "screens_text" varchar;
  ALTER TABLE "_projects_v" ADD COLUMN "version_screens_heading" varchar;
  ALTER TABLE "_projects_v" ADD COLUMN "version_screens_background_image_id" integer;
  ALTER TABLE "_projects_v" ADD COLUMN "version_screens_text" varchar;
  ALTER TABLE "projects_screens_items" ADD CONSTRAINT "projects_screens_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_screens_items" ADD CONSTRAINT "projects_screens_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_screens_items" ADD CONSTRAINT "_projects_v_version_screens_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v_version_screens_items" ADD CONSTRAINT "_projects_v_version_screens_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "projects_screens_items_order_idx" ON "projects_screens_items" USING btree ("_order");
  CREATE INDEX "projects_screens_items_parent_id_idx" ON "projects_screens_items" USING btree ("_parent_id");
  CREATE INDEX "projects_screens_items_image_idx" ON "projects_screens_items" USING btree ("image_id");
  CREATE INDEX "_projects_v_version_screens_items_order_idx" ON "_projects_v_version_screens_items" USING btree ("_order");
  CREATE INDEX "_projects_v_version_screens_items_parent_id_idx" ON "_projects_v_version_screens_items" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_screens_items_image_idx" ON "_projects_v_version_screens_items" USING btree ("image_id");
  ALTER TABLE "projects" ADD CONSTRAINT "projects_screens_background_image_id_media_id_fk" FOREIGN KEY ("screens_background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_screens_background_image_id_media_id_fk" FOREIGN KEY ("version_screens_background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "projects_screens_screens_background_image_idx" ON "projects" USING btree ("screens_background_image_id");
  CREATE INDEX "_projects_v_version_screens_version_screens_background_i_idx" ON "_projects_v" USING btree ("version_screens_background_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects_screens_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_version_screens_items" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "projects_screens_items" CASCADE;
  DROP TABLE "_projects_v_version_screens_items" CASCADE;
  ALTER TABLE "projects" DROP CONSTRAINT "projects_screens_background_image_id_media_id_fk";
  
  ALTER TABLE "_projects_v" DROP CONSTRAINT "_projects_v_version_screens_background_image_id_media_id_fk";
  
  DROP INDEX "projects_screens_screens_background_image_idx";
  DROP INDEX "_projects_v_version_screens_version_screens_background_i_idx";
  ALTER TABLE "projects" DROP COLUMN "screens_heading";
  ALTER TABLE "projects" DROP COLUMN "screens_background_image_id";
  ALTER TABLE "projects" DROP COLUMN "screens_text";
  ALTER TABLE "_projects_v" DROP COLUMN "version_screens_heading";
  ALTER TABLE "_projects_v" DROP COLUMN "version_screens_background_image_id";
  ALTER TABLE "_projects_v" DROP COLUMN "version_screens_text";`)
}
