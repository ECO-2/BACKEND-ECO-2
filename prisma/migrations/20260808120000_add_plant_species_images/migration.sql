-- AlterTable
-- Adds optional image URLs to PlantSpecies. No binary data is stored here —
-- these point at files in external object storage (e.g. Firebase Storage /
-- Azure Blob + CDN), populated via the admin backoffice once real,
-- properly-licensed photos are sourced for each species.
ALTER TABLE "PlantSpecies" ADD COLUMN "image_url" TEXT;
ALTER TABLE "PlantSpecies" ADD COLUMN "thumbnail_url" TEXT;
