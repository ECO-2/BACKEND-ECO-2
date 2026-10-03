import { prisma } from "@/lib/prisma"
import type { PrismaResourceConfig } from "../adapters/prisma-resource"

export const appConfigResourceConfig: PrismaResourceConfig = {
  resourceId: "AppConfig",
  model: prisma.appConfig,
  fields: [
    { path: "id", type: "string", isId: true, readOnly: true },
    { path: "use_custom_model", type: "boolean" },
    { path: "updated_at", type: "datetime", readOnly: true },
  ],
}