import { prisma } from "@/lib/prisma"
import type { PrismaResourceConfig } from "../adapters/prisma-resource"

export const userPlantTaskResourceConfig: PrismaResourceConfig = {
  resourceId: "UserPlantTask",
  model: prisma.userPlantTask,
  fields: [
    { path: "id", type: "uuid", isId: true, readOnly: true },
    { path: "user_plant_id", type: "string", isRequired: true },
    {
      path: "task_type",
      type: "string",
      isRequired: true,
      availableValues: ["watering", "fertilizing", "pruning", "repotting", "misting", "cleaning"],
    },
    { path: "next_due_at", type: "datetime", isRequired: true, isSortable: true },
    { path: "last_completed_at", type: "datetime" },
    { path: "frequency_days", type: "number", isRequired: true },
    { path: "created_at", type: "datetime", readOnly: true },
  ],
}
