import { prisma } from "@/lib/prisma"
import type { PrismaResourceConfig } from "../adapters/prisma-resource.js"

export const achievementResourceConfig: PrismaResourceConfig = {
  resourceId: "Achievement",
  model: prisma.achievement,
  fields: [
    { path: "id", type: "uuid", isId: true, readOnly: true },
    { path: "name", type: "string", isRequired: true },
    { path: "description", type: "textarea", isRequired: true },
    { path: "condition_type", type: "string", isRequired: true },
    { path: "condition_value", type: "number", isRequired: true },
    { path: "xp_reward", type: "number", isRequired: true },
    { path: "icon_url", type: "string" },
    { path: "created_at", type: "datetime", readOnly: true },
    { path: "updated_at", type: "datetime", readOnly: true },
  ],
}
