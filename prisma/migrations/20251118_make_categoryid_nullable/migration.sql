-- Drop existing foreign key constraint
ALTER TABLE "exercise_groups" DROP CONSTRAINT "exercise_groups_category_id_fkey";

-- Alter column to be nullable
ALTER TABLE "exercise_groups" ALTER COLUMN "category_id" DROP NOT NULL;

-- Recreate the foreign key constraint with nullable column
ALTER TABLE "exercise_groups" ADD CONSTRAINT "exercise_groups_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "exercise_group_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
