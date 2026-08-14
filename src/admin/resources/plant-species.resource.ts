import { prisma } from "@/lib/prisma"
import type { PrismaResourceConfig } from "../adapters/prisma-resource"

export const plantSpeciesResourceConfig: PrismaResourceConfig = {
  resourceId: "PlantSpecies",
  model: prisma.plantSpecies,
  fields: [
    { path: "id", type: "uuid", isId: true, readOnly: true },
    { path: "scientific_name", type: "string", isRequired: true },
    { path: "common_name", type: "string", isRequired: true },
    {
      path: "category",
      type: "string",
      isRequired: true,
      availableValues: ["tropical", "succulent", "cactus", "fern", "flowering", "herb", "tree", "other"],
    },
    {
      path: "light_requirement",
      type: "string",
      isRequired: true,
      availableValues: ["low", "medium", "high", "indirect"],
    },
    { path: "water_frequency_days", type: "number", isRequired: true },
    {
      path: "humidity_preference",
      type: "string",
      isRequired: true,
      availableValues: ["low", "medium", "high"],
    },
    { path: "air_purification_score", type: "number" },
    { path: "min_temperature", type: "number", isRequired: true },
    { path: "max_temperature", type: "number", isRequired: true },
    // Populated by whoever sources/licenses the species photo. See
    // ADMIN.md for the recommended upload flow (Firebase Storage / Azure
    // Blob + CDN, WebP, thumbnail + full size).
    { path: "image_url", type: "string" },
    { path: "thumbnail_url", type: "string" },
    { path: "created_at", type: "datetime", isSortable: true, readOnly: true },
  ],
}
