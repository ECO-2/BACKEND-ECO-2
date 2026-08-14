import { prisma } from "@/lib/prisma"
import type { PrismaResourceConfig } from "../adapters/prisma-resource"

// password_hash / reset_token_hash / provider_id are intentionally excluded
// from admin properties — there is no legitimate reason to display or edit
// a password hash from a backoffice UI.
export const userResourceConfig: PrismaResourceConfig = {
  resourceId: "User",
  model: prisma.user,
  fields: [
    { path: "id", type: "uuid", isId: true, readOnly: true },
    { path: "email", type: "string", isRequired: true },
    { path: "username", type: "string" },
    { path: "avatar_url", type: "string" },
    {
      path: "role",
      type: "string",
      isRequired: true,
      availableValues: ["user", "admin"],
    },
    { path: "plan_type", type: "string" },
    {
      path: "gender",
      type: "string",
      availableValues: ["male", "female", "other", "prefer_not_to_say"],
    },
    { path: "birth_day", type: "date" },
    { path: "onboarding_completed", type: "boolean" },
    { path: "notifications_enabled", type: "boolean" },
    { path: "reminder_start_hour", type: "number" },
    { path: "reminder_end_hour", type: "number" },
    { path: "created_at", type: "datetime", readOnly: true },
    { path: "updated_at", type: "datetime", readOnly: true },
    { path: "deleted_at", type: "datetime" },
  ],
}
