import { z } from "zod"
import { hashPassword } from "@/utils/hash"
import { createUser, findUserByEmail } from "@/infrastructure/repositories/user.repository"
import { AppError } from "@/core/errors/AppError"

const registerSchema = z.object({
  email: z.email(),
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

  return user
}