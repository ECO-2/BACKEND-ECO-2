import { prisma } from "@/lib/prisma"
import type { PrismaResourceConfig } from "../adapters/prisma-resource"

export const plantIdentificationResourceConfig: PrismaResourceConfig = {
  resourceId: "PlantIdentification",
  model: prisma.plantIdentification,
  fields: [
    { path: "id", type: "uuid", isId: true, readOnly: true },
    { path: "user_id", type: "string", isRequired: true },
    { path: "image_url", type: "string" },
    { path: "identified_species_id", type: "string" },
    { path: "confidence_score", type: "float", isRequired: true },
    {
      path: "source",
      type: "string",
      isRequired: true,
      availableValues: ["tflite", "plant_id_api"],
    },
    { path: "created_at", type: "datetime", isSortable: true, readOnly: true },
  ],
}
