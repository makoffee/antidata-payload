import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_security_contact_form_content_screening" AS ENUM('quarantine', 'drop', 'off');
  CREATE TABLE "security" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"contact_form_paused" boolean DEFAULT false,
  	"contact_form_honeypot" boolean DEFAULT true,
  	"contact_form_min_fill_seconds" numeric DEFAULT 3,
  	"contact_form_turnstile" boolean DEFAULT true,
  	"contact_form_spam_filter" boolean DEFAULT true,
  	"contact_form_content_screening" "enum_security_contact_form_content_screening" DEFAULT 'quarantine',
  	"contact_form_rate_limit" boolean DEFAULT true,
  	"contact_form_max_per_hour" numeric DEFAULT 20,
  	"contact_form_max_per_address_per_day" numeric DEFAULT 3,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "security" CASCADE;
  DROP TYPE "public"."enum_security_contact_form_content_screening";`)
}
