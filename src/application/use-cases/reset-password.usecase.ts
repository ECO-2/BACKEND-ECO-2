import { z } from "zod"
import crypto from "crypto"
import { AppError } from "@/core/errors/AppError"
import { findUserByResetTokenHash, updateUserPassword, setResetTokenHash } from "@/infrastructure/repositories/user.repository"
import { hashPassword } from "@/utils/hash"

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000 // 30 minutos

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  new_password: z.string().min(6)
})

const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex")

export const resetPasswordUseCase = async (input: unknown) => {
  const { token, new_password } = resetPasswordSchema.parse(input)

  const [timestampStr] = token.split(".")
  const issuedAt = Number(timestampStr)
  if (!issuedAt || Date.now() - issuedAt > RESET_TOKEN_TTL_MS) {
    throw new AppError("Invalid or expired token", 400)
  }

  const hash = hashToken(token)
  const user = await findUserByResetTokenHash(hash)
  if (!user) throw new AppError("Invalid or expired token", 400)

  const password_hash = await hashPassword(new_password)
  await updateUserPassword(user.id, password_hash)
  await setResetTokenHash(user.id, null)
}