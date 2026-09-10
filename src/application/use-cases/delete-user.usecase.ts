import { z } from "zod"
import { AppError } from "@/core/errors/AppError"
import { findUserById, deleteUserAndData } from "@/infrastructure/repositories/user.repository"
import { comparePassword } from "@/utils/hash"

const deleteUserSchema = z.object({
  password: z.string().optional()
})

export const deleteUserUseCase = async (userId: string, input: unknown) => {
  const { password } = deleteUserSchema.parse(input ?? {})

  const user = await findUserById(userId)
  if (!user) throw new AppError("User not found", 404)

  if (user.password_hash) {
    if (!password) throw new AppError("Password is required to delete your account", 422)
    const valid = await comparePassword(password, user.password_hash)
    if (!valid) throw new AppError("Incorrect password", 401)
  }

  await deleteUserAndData(userId)
}