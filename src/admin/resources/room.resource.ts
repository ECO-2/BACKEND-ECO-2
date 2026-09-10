import { prisma } from "@/lib/prisma"
import type { PrismaResourceConfig } from "../adapters/prisma-resource"

export const roomResourceConfig: PrismaResourceConfig = {
  resourceId: "Room",
  model: prisma.room,
  fields: [
    { path: "id", type: "uuid", isId: true, readOnly: true },
    { path: "user_id", type: "string", isRequired: true },
    { path: "name", type: "string", isRequired: true },
    { path: "size_m2", type: "float" },
    { path: "light_level", type: "string", availableValues: ["low", "medium", "high"] },
    { path: "created_at", type: "datetime", isSortable: true, readOnly: true },
    { path: "deleted_at", type: "datetime" },
  ],
}
