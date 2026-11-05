import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_pages_blocks_card_grid_cards_icon" ADD VALUE 'blocks' BEFORE 'code';
  ALTER TYPE "public"."enum_pages_blocks_card_grid_cards_icon" ADD VALUE 'component' BEFORE 'code';
  ALTER TYPE "public"."enum__pages_v_blocks_card_grid_cards_icon" ADD VALUE 'blocks' BEFORE 'code';
  ALTER TYPE "public"."enum__pages_v_blocks_card_grid_cards_icon" ADD VALUE 'component' BEFORE 'code';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_card_grid_cards" ALTER COLUMN "icon" SET DATA TYPE text;
  DROP TYPE "public"."enum_pages_blocks_card_grid_cards_icon";
  CREATE TYPE "public"."enum_pages_blocks_card_grid_cards_icon" AS ENUM('compass', 'lightbulb', 'sparkles', 'smartphone', 'monitorSmartphone', 'palette', 'penTool', 'layers', 'code', 'box', 'gem', 'megaphone', 'rocket', 'target', 'users', 'zap');
  ALTER TABLE "pages_blocks_card_grid_cards" ALTER COLUMN "icon" SET DATA TYPE "public"."enum_pages_blocks_card_grid_cards_icon" USING "icon"::"public"."enum_pages_blocks_card_grid_cards_icon";
  ALTER TABLE "_pages_v_blocks_card_grid_cards" ALTER COLUMN "icon" SET DATA TYPE text;
  DROP TYPE "public"."enum__pages_v_blocks_card_grid_cards_icon";
  CREATE TYPE "public"."enum__pages_v_blocks_card_grid_cards_icon" AS ENUM('compass', 'lightbulb', 'sparkles', 'smartphone', 'monitorSmartphone', 'palette', 'penTool', 'layers', 'code', 'box', 'gem', 'megaphone', 'rocket', 'target', 'users', 'zap');
  ALTER TABLE "_pages_v_blocks_card_grid_cards" ALTER COLUMN "icon" SET DATA TYPE "public"."enum__pages_v_blocks_card_grid_cards_icon" USING "icon"::"public"."enum__pages_v_blocks_card_grid_cards_icon";`)
}
