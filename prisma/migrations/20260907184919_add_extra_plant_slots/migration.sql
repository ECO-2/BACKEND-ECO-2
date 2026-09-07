-- AlterTable
ALTER TABLE "User" ADD COLUMN     "extra_plant_slots" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rental_plant_slots" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rental_slots_expires_at" TIMESTAMP(3);
