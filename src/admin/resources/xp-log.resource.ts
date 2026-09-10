import { prisma } from "@/lib/prisma"
import type { PrismaResourceConfig } from "../adapters/prisma-resource"

export const xpLogResourceConfig: PrismaResourceConfig = {
  resourceId: "XpLog",
  model: prisma.xpLog,
  fields: [
    { path: "id", type: "uuid", isId: true, readOnly: true },
    { path: "user_id", type: "string", isRequired: true },
    { path: "action_type", type: "string", isRequired: true },
    { path: "xp_earned", type: "number", isRequired: true },
    { path: "created_at", type: "datetime", isSortable: true, readOnly: true },
  ],
}
