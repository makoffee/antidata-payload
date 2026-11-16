import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "appearance" ADD COLUMN "admin_branding_logo_light_id" integer;
  ALTER TABLE "appearance" ADD COLUMN "admin_branding_logo_dark_id" integer;
  ALTER TABLE "appearance" ADD COLUMN "admin_branding_icon_light_id" integer;
  ALTER TABLE "appearance" ADD COLUMN "admin_branding_icon_dark_id" integer;
  ALTER TABLE "appearance" ADD CONSTRAINT "appearance_admin_branding_logo_light_id_media_id_fk" FOREIGN KEY ("admin_branding_logo_light_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "appearance" ADD CONSTRAINT "appearance_admin_branding_logo_dark_id_media_id_fk" FOREIGN KEY ("admin_branding_logo_dark_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "appearance" ADD CONSTRAINT "appearance_admin_branding_icon_light_id_media_id_fk" FOREIGN KEY ("admin_branding_icon_light_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "appearance" ADD CONSTRAINT "appearance_admin_branding_icon_dark_id_media_id_fk" FOREIGN KEY ("admin_branding_icon_dark_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "appearance_admin_branding_admin_branding_logo_light_idx" ON "appearance" USING btree ("admin_branding_logo_light_id");
  CREATE INDEX "appearance_admin_branding_admin_branding_logo_dark_idx" ON "appearance" USING btree ("admin_branding_logo_dark_id");
  CREATE INDEX "appearance_admin_branding_admin_branding_icon_light_idx" ON "appearance" USING btree ("admin_branding_icon_light_id");
  CREATE INDEX "appearance_admin_branding_admin_branding_icon_dark_idx" ON "appearance" USING btree ("admin_branding_icon_dark_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "appearance" DROP CONSTRAINT "appearance_admin_branding_logo_light_id_media_id_fk";
  
  ALTER TABLE "appearance" DROP CONSTRAINT "appearance_admin_branding_logo_dark_id_media_id_fk";
  
  ALTER TABLE "appearance" DROP CONSTRAINT "appearance_admin_branding_icon_light_id_media_id_fk";
  
  ALTER TABLE "appearance" DROP CONSTRAINT "appearance_admin_branding_icon_dark_id_media_id_fk";
  
  DROP INDEX "appearance_admin_branding_admin_branding_logo_light_idx";
  DROP INDEX "appearance_admin_branding_admin_branding_logo_dark_idx";
  DROP INDEX "appearance_admin_branding_admin_branding_icon_light_idx";
  DROP INDEX "appearance_admin_branding_admin_branding_icon_dark_idx";
  ALTER TABLE "appearance" DROP COLUMN "admin_branding_logo_light_id";
  ALTER TABLE "appearance" DROP COLUMN "admin_branding_logo_dark_id";
  ALTER TABLE "appearance" DROP COLUMN "admin_branding_icon_light_id";
  ALTER TABLE "appearance" DROP COLUMN "admin_branding_icon_dark_id";`)
}
