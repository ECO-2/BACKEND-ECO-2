-- CreateTable
CREATE TABLE "PlantIdentification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "image_url" TEXT,
    "identified_species_id" TEXT,
    "confidence_score" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'tflite',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlantIdentification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PlantIdentification" ADD CONSTRAINT "PlantIdentification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantIdentification" ADD CONSTRAINT "PlantIdentification_identified_species_id_fkey" FOREIGN KEY ("identified_species_id") REFERENCES "PlantSpecies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
