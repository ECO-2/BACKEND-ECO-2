import { z } from "zod"
import crypto from "crypto"
import { findUserByEmail, setResetTokenHash } from "@/infrastructure/repositories/user.repository"

const forgotPasswordSchema = z.object({
  email: z.string().email()
})

const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex")

export const forgotPasswordUseCase = async (input: unknown) => {
  const { email } = forgotPasswordSchema.parse(input)

  const user = await findUserByEmail(email)
  // Responde genérico aunque el usuario no exista, para no filtrar qué correos están registrados
  if (!user) return

  const rawToken = `${Date.now()}.${crypto.randomBytes(32).toString("hex")}`
  const hash = hashToken(rawToken)

  await setResetTokenHash(user.id, hash)

  // TODO: enviar rawToken por correo cuando se configure un proveedor de email.
  console.log(`Password reset token for ${email}: ${rawToken}`)
}