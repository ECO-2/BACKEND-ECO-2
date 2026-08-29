import { prisma } from "@/lib/prisma"
import type { PrismaResourceConfig } from "../adapters/prisma-resource"

// token_hash is intentionally excluded — same rationale as password_hash on
// User: there is no legitimate reason to display or edit a session token
// hash from a backoffice UI. Admins can still revoke a session by setting
// revoked_at.
export const sessionResourceConfig: PrismaResourceConfig = {
  resourceId: "Session",
  model: prisma.session,
  fields: [
    { path: "id", type: "uuid", isId: true, readOnly: true },
    { path: "user_id", type: "string", isRequired: true },
    { path: "expires_at", type: "datetime", isRequired: true },
    { path: "revoked_at", type: "datetime" },
    { path: "created_at", type: "datetime", isSortable: true, readOnly: true },
  ],
}
