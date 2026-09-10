import { prisma } from "@/lib/prisma"
import type { PrismaResourceConfig } from "../adapters/prisma-resource"

export const careLogResourceConfig: PrismaResourceConfig = {
  resourceId: "CareLog",
  model: prisma.careLog,
  fields: [
    { path: "id", type: "uuid", isId: true, readOnly: true },
    { path: "user_plant_id", type: "string", isRequired: true },
    { path: "task_id", type: "string" },
    {
      path: "task_type",
      type: "string",
      isRequired: true,
      availableValues: ["watering", "fertilizing", "pruning", "repotting", "misting", "cleaning"],
    },
    { path: "performed_at", type: "datetime", isRequired: true, isSortable: true },
    { path: "created_at", type: "datetime", readOnly: true },
  ],
}
