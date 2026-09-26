import { prisma } from "@/lib/prisma"
import type { PrismaResourceConfig } from "../adapters/prisma-resource"

export const missingSpeciesSuggestionResourceConfig: PrismaResourceConfig = {
  resourceId: "MissingSpeciesSuggestion",
  model: prisma.missingSpeciesSuggestion,
  fields: [
    { path: "id", type: "uuid", isId: true, readOnly: true },
    { path: "scientific_name", type: "string", isRequired: true },
    { path: "common_name", type: "string" },
    { path: "times_requested", type: "number", isSortable: true, readOnly: true },
    { path: "last_requested_at", type: "datetime", isSortable: true, readOnly: true },
    { path: "created_at", type: "datetime", isSortable: true, readOnly: true },
  ],
}