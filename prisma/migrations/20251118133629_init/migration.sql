-- CreateEnum
CREATE TYPE "ExerciseStatus" AS ENUM ('active', 'inactive');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" TEXT NOT NULL,
    "codeToRecovery" VARCHAR(255),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menus" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "pdf_url" VARCHAR(500) NOT NULL,
    "min_calories" INTEGER,
    "max_calories" INTEGER,
    "status" "ExerciseStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "video_url" VARCHAR(255),
    "has_method" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "methods" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_group_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "exercise_group_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_groups" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category_id" INTEGER NOT NULL,
    "publicName" VARCHAR(255),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "exercise_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_methods" (
    "id" SERIAL NOT NULL,
    "rest" VARCHAR(255) NOT NULL,
    "observations" VARCHAR,
    "order" INTEGER,
    "exercise_group_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "exercise_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_configurations" (
    "id" SERIAL NOT NULL,
    "series" VARCHAR(255) NOT NULL,
    "repetitions" VARCHAR(255) NOT NULL,
    "exercise_method_id" INTEGER,
    "exercise_id" INTEGER,
    "method_id" INTEGER,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "exercise_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_sheets" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "publicName" VARCHAR(255),
    "slug" VARCHAR(255),
    "offlinePdf" VARCHAR(255),
    "newTabPdf" VARCHAR(255),
    "pdfPath" VARCHAR(255),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "training_sheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_days" (
    "id" SERIAL NOT NULL,
    "day" INTEGER NOT NULL,
    "training_sheet_id" INTEGER NOT NULL,
    "exercise_group_id" INTEGER NOT NULL,
    "short_name" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "training_days_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "exercise_groups" ADD CONSTRAINT "exercise_groups_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "exercise_group_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_methods" ADD CONSTRAINT "exercise_methods_exercise_group_id_fkey" FOREIGN KEY ("exercise_group_id") REFERENCES "exercise_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_configurations" ADD CONSTRAINT "exercise_configurations_exercise_method_id_fkey" FOREIGN KEY ("exercise_method_id") REFERENCES "exercise_methods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_configurations" ADD CONSTRAINT "exercise_configurations_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_configurations" ADD CONSTRAINT "exercise_configurations_method_id_fkey" FOREIGN KEY ("method_id") REFERENCES "methods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_days" ADD CONSTRAINT "training_days_training_sheet_id_fkey" FOREIGN KEY ("training_sheet_id") REFERENCES "training_sheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_days" ADD CONSTRAINT "training_days_exercise_group_id_fkey" FOREIGN KEY ("exercise_group_id") REFERENCES "exercise_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
