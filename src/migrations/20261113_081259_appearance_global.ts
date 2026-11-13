import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_appearance_background_style" AS ENUM('cover', 'fixed', 'parallax');
  CREATE TABLE "appearance" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"background_style" "enum_appearance_background_style" DEFAULT 'parallax',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "appearance" CASCADE;
  DROP TYPE "public"."enum_appearance_background_style";`)
}
