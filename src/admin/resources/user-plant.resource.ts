import { prisma } from "@/lib/prisma"
import type { PrismaResourceConfig } from "../adapters/prisma-resource"

export const userPlantResourceConfig: PrismaResourceConfig = {
  resourceId: "UserPlant",
  model: prisma.userPlant,
  fields: [
    { path: "id", type: "uuid", isId: true, readOnly: true },
    { path: "user_id", type: "string", isRequired: true },
    { path: "species_id", type: "string", isRequired: true },
    { path: "nickname", type: "string" },
    {
      path: "health_status",
      type: "string",
      isRequired: true,
      availableValues: ["excellent", "good", "fair", "poor", "critical"],
    },
    { path: "acquired_at", type: "datetime" },
    { path: "last_watered_at", type: "datetime" },
    { path: "created_at", type: "datetime", isSortable: true, readOnly: true },
    { path: "updated_at", type: "datetime", readOnly: true },
    { path: "deleted_at", type: "datetime" },
  ],
}
