import { prisma } from "@/lib/prisma"
import type { PrismaResourceConfig } from "../adapters/prisma-resource"

export const userAchievementResourceConfig: PrismaResourceConfig = {
  resourceId: "UserAchievement",
  model: prisma.userAchievement,
  fields: [
    { path: "id", type: "uuid", isId: true, readOnly: true },
    { path: "user_id", type: "string", isRequired: true },
    { path: "achievement_id", type: "string", isRequired: true },
    { path: "unlocked_at", type: "datetime", isSortable: true },
  ],
}
