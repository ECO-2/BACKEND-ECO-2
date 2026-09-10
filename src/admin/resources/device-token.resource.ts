import { prisma } from "@/lib/prisma"
import type { PrismaResourceConfig } from "../adapters/prisma-resource"

export const deviceTokenResourceConfig: PrismaResourceConfig = {
  resourceId: "DeviceToken",
  model: prisma.deviceToken,
  fields: [
    { path: "id", type: "uuid", isId: true, readOnly: true },
    { path: "user_id", type: "string", isRequired: true },
    { path: "token", type: "string", isRequired: true },
    { path: "created_at", type: "datetime", isSortable: true, readOnly: true },
  ],
}
