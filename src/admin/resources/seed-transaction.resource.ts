import { prisma } from "@/lib/prisma"
import type { PrismaResourceConfig } from "../adapters/prisma-resource"

export const seedTransactionResourceConfig: PrismaResourceConfig = {
  resourceId: "SeedTransaction",
  model: prisma.seedTransaction,
  fields: [
    { path: "id", type: "uuid", isId: true, readOnly: true },
    { path: "user_id", type: "string", isRequired: true },
    { path: "amount", type: "number", isRequired: true },
    { path: "reason", type: "string", isRequired: true },
    { path: "created_at", type: "datetime", isSortable: true, readOnly: true },
  ],
}
