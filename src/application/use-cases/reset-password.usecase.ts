import { z } from "zod"
import { AppError } from "@/core/errors/AppError"
import { findUserByResetTokenHash, updateUserPassword, setResetTokenHash } from "@/infrastructure/repositories/user.repository"
import { hashPassword } from "@/utils/hash"
import { hashResetCode, unpackResetToken } from "@/utils/reset-code"

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  new_password: z.string().min(6)
})

export const resetPasswordUseCase = async (input: unknown) => {
  const { token, new_password } = resetPasswordSchema.parse(input)

  // El vencimiento ya no viaja dentro del código: se guarda junto al hash al
  // emitirlo, así que el código que pega la persona es solo el código.
  const hash = hashResetCode(token)
  const user = await findUserByResetTokenHash(hash)
  if (!user || !user.reset_token_hash) throw new AppError("Invalid or expired token", 400)

  const stored = unpackResetToken(user.reset_token_hash)
  if (!stored || Date.now() > stored.expiresAt) {
    // Un código vencido se retira para que no quede colgado en la fila.
    await setResetTokenHash(user.id, null)
    throw new AppError("Invalid or expired token", 400)
  }

  const password_hash = await hashPassword(new_password)
  await updateUserPassword(user.id, password_hash)
  await setResetTokenHash(user.id, null)
}
