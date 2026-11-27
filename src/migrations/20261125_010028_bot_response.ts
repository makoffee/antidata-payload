import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_security_contact_form_bot_response" AS ENUM('reject', 'pretend');
  ALTER TABLE "security" ADD COLUMN "contact_form_bot_response" "enum_security_contact_form_bot_response" DEFAULT 'reject';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "security" DROP COLUMN "contact_form_bot_response";
  DROP TYPE "public"."enum_security_contact_form_bot_response";`)
}
