import { z } from "zod"
import { hashPassword } from "@/utils/hash"
import { createUser, findUserByEmail, setEmailVerifyTokenHash } from "@/infrastructure/repositories/user.repository"
import { AppError } from "@/core/errors/AppError"
import { generateVerifyToken, packVerifyToken } from "@/utils/email-verification-token"
import { sendVerificationEmail } from "@/infrastructure/services/verification-email.service"

const registerSchema = z.object({
  email: z.email(),
  username: z.string().min(3).max(30).optional(),
  password: z.string().min(6)
})

export const registerUser = async (input: unknown) => {
  const data = registerSchema.parse(input)

  const existingUser = await findUserByEmail(data.email)

  if (existingUser) {
    throw new AppError("User already exists", 409)
  }

  const password_hash = await hashPassword(data.password)

  const user = await createUser({
    email: data.email,
    password_hash
  })

  const token = generateVerifyToken()
  await setEmailVerifyTokenHash(user.id, packVerifyToken(token))
  sendVerificationEmail(data.email, token).catch(() => {})

  return user
}