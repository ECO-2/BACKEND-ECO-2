import { z } from "zod"
import { findUserByEmail, setResetTokenHash } from "@/infrastructure/repositories/user.repository"
import { generateResetCode, packResetToken } from "@/utils/reset-code"
import { sendPasswordResetCode } from "@/infrastructure/services/password-reset-email.service"

const forgotPasswordSchema = z.object({
  email: z.string().email()
})

export const forgotPasswordUseCase = async (input: unknown) => {
  const { email } = forgotPasswordSchema.parse(input)

  const user = await findUserByEmail(email)
  // Responde genérico aunque el usuario no exista, para no filtrar qué correos están registrados
  if (!user) return

  const code = generateResetCode()
  await setResetTokenHash(user.id, packResetToken(code))

  // El envío se espera para que un fallo del proveedor quede en el log del
  // servidor, pero su resultado no cambia la respuesta al cliente: hacerlo
  // delataría qué correos están registrados.
  await sendPasswordResetCode(email, code)
}
