import { prisma } from "@/lib/prisma"
import type { PrismaResourceConfig } from "../adapters/prisma-resource"

// UserProgress has no `id` column — `user_id` is the primary key, set once
// on create (see the isId/isCreate handling in the adapter's sanitize()).
//
// Caveat: because user_id is both the PK and a normal editable field, the
// Edit screen renders it as a text input. AdminJS derives "which record am
// I updating" from the submitted value of that field (BaseRecord.update
// calls storeParams(params) before resource.update(this.id(), ...)), so
// changing it in the Edit form does NOT rename/move this record — it makes
// AdminJS look up a *different* user_id instead (404 if it doesn't exist,
// or a silent edit of an unrelated record if it does). Leave it untouched
// when editing xp/level/seeds; only set it deliberately when creating.
export const userProgressResourceConfig: PrismaResourceConfig = {
  resourceId: "UserProgress",
  model: prisma.userProgress,
  fields: [
    { path: "user_id", type: "uuid", isId: true, isRequired: true },
    { path: "xp", type: "number", isRequired: true },
    { path: "level", type: "number", isRequired: true },
    { path: "streak_days", type: "number", isRequired: true },
    { path: "seeds", type: "number", isRequired: true },
    { path: "updated_at", type: "datetime", readOnly: true },
  ],
}
