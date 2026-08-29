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
    // image_url/thumbnail_url are populated automatically by the "Foto"
    // upload widget on this resource (see admin/index.ts — uploadFileFeature
    // + resizeSpeciesPhoto) once a real photo is dropped in the edit form.
    // They can still be set/edited by hand (e.g. to point at an
    // already-hosted image) — the widget is a convenience, not the only way.
    { path: "image_url", type: "string" },
    { path: "thumbnail_url", type: "string" },
    // Internal: filename the upload widget wrote the raw photo to under
    // public/species/. Not meant to be edited by hand.
    { path: "image_key", type: "string" },
    { path: "created_at", type: "datetime", isSortable: true, readOnly: true },
  ],
}
