import { z } from "zod"
import { AppError } from "@/core/errors/AppError"
import { findUserByEmail } from "@/infrastructure/repositories/user.repository"
import { createSession } from "@/infrastructure/repositories/session.repository"
import { comparePassword } from "@/utils/hash"
import { generateAccessToken } from "@/utils/jwt"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

export const loginUser = async (input: unknown) => {
  const data = loginSchema.parse(input)

  const user = await findUserByEmail(data.email)

  if (!user || !user.password_hash) {
    throw new AppError("Invalid credentials", 401)
  }

  const isValid = await comparePassword(data.password, user.password_hash)

  if (!isValid) {
    throw new AppError("Invalid credentials", 401)
  }

  const accessToken = generateAccessToken({ sub: user.id, email: user.email })
  const refreshToken = await createSession(user.id)

  return { accessToken, refreshToken }
}