import { z } from "zod"
import { AppError } from "@/core/errors/AppError"
import { findUserById, updateUserPassword } from "@/infrastructure/repositories/user.repository"
import { comparePassword, hashPassword } from "@/utils/hash"

const updatePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(6)
})

export const updatePasswordUseCase = async (userId: string, input: unknown) => {
  const { current_password, new_password } = updatePasswordSchema.parse(input)

  const user = await findUserById(userId)
  if (!user) throw new AppError("User not found", 404)
  if (!user.password_hash) throw new AppError("This account does not use a password", 400)

  const valid = await comparePassword(current_password, user.password_hash)
  if (!valid) throw new AppError("Current password is incorrect", 401)

  const password_hash = await hashPassword(new_password)
  await updateUserPassword(userId, password_hash)
}