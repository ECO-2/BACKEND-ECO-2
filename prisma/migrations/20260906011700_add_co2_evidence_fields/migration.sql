-- AlterTable
ALTER TABLE "PlantSpecies" ADD COLUMN     "co2_evidence_level" TEXT,
ADD COLUMN     "co2_range_max" DECIMAL(65,30),
ADD COLUMN     "co2_range_min" DECIMAL(65,30),
ADD COLUMN     "metabolism" TEXT;
