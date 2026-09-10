import { z } from "zod"
import { AppError } from "@/core/errors/AppError"
import { findUserByUsername, updateUserProfile } from "@/infrastructure/repositories/user.repository"
import { canUseAvatar } from "@/domain/avatars/catalog"
import { ownedAvatarIds } from "@/application/use-cases/avatars/avatars.usecase"

const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  // Id del avatar elegido en la app (no una URL): se guarda en avatar_url, que
  // ya existia. Se limita el formato para que no entre texto arbitrario.
  avatar_url: z.string().regex(/^[a-z0-9_-]{1,40}$/).nullable().optional(),
  notifications_enabled: z.boolean().optional(),
  reminder_start_hour: z.number().int().min(6).max(22).optional(),
  reminder_end_hour: z.number().int().min(6).max(22).optional(),
}).refine(data => {
  if (data.reminder_start_hour !== undefined && data.reminder_end_hour !== undefined) {
    return data.reminder_start_hour < data.reminder_end_hour
  }
  return true
}, {
  message: "reminder_start_hour must be before reminder_end_hour"
})

export const updateProfile = async (userId: string, input: unknown) => {
  const data = updateProfileSchema.parse(input)

  if (data.username) {
    const existing = await findUserByUsername(data.username)
    if (existing && existing.id !== userId) {
      throw new AppError("Username already taken", 409)
    }
  }

  // Sin esta comprobacion se podria fijar avatar_url a uno de pago sin haberlo
  // comprado: la validacion del esquema solo mira el formato de la cadena.
  if (data.avatar_url) {
    const owned = await ownedAvatarIds(userId)
    if (!canUseAvatar(data.avatar_url, owned)) {
      throw new AppError("avatar_not_owned", 403)
    }
  }

  return updateUserProfile(userId, data)
}