-- CreateEnum
CREATE TYPE "PlantCategory" AS ENUM ('tropical', 'succulent', 'cactus', 'fern', 'flowering', 'herb', 'tree', 'other');

-- CreateEnum
CREATE TYPE "LightRequirement" AS ENUM ('low', 'medium', 'high', 'indirect');

-- CreateEnum
CREATE TYPE "HumidityPreference" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "HealthStatus" AS ENUM ('excellent', 'good', 'fair', 'poor', 'critical');

-- CreateTable
CREATE TABLE "PlantSpecies" (
    "id" TEXT NOT NULL,
    "scientific_name" TEXT NOT NULL,
    "common_name" TEXT NOT NULL,
    "category" "PlantCategory" NOT NULL,
    "light_requirement" "LightRequirement" NOT NULL,
    "water_frequency_days" INTEGER NOT NULL,
    "humidity_preference" "HumidityPreference" NOT NULL,
    "air_purification_score" INTEGER NOT NULL DEFAULT 0,
    "min_temperature" INTEGER NOT NULL,
    "max_temperature" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlantSpecies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPlant" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "species_id" TEXT NOT NULL,
    "nickname" TEXT,
    "health_status" "HealthStatus" NOT NULL DEFAULT 'good',
    "acquired_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_watered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "UserPlant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlantSpecies_scientific_name_key" ON "PlantSpecies"("scientific_name");

-- AddForeignKey
ALTER TABLE "UserPlant" ADD CONSTRAINT "UserPlant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPlant" ADD CONSTRAINT "UserPlant_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "PlantSpecies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
