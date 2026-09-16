import { z } from "zod"
import { AppError } from "@/core/errors/AppError"
import {
  findUserByEmailVerifyTokenHash,
  markEmailVerified
} from "@/infrastructure/repositories/user.repository"
import { addSeeds } from "@/infrastructure/repositories/gamification.repository"
import { hashVerifyToken, unpackVerifyToken } from "@/utils/email-verification-token"

const schema = z.object({ token: z.string().min(1) })

const VERIFY_SEED_REWARD = 10

export const verifyEmailUseCase = async (input: unknown) => {
  const { token } = schema.parse(input)

  const hash = hashVerifyToken(token)
  const user = await findUserByEmailVerifyTokenHash(hash)
  if (!user) throw new AppError("Invalid or expired token", 400)

  const unpacked = unpackVerifyToken(user.email_verify_token_hash!)
  if (!unpacked || unpacked.expiresAt < Date.now()) {
    throw new AppError("Invalid or expired token", 400)
  }

  if (user.email_verified) {
    return { alreadyVerified: true }
  }

  await markEmailVerified(user.id)
  await addSeeds(user.id, VERIFY_SEED_REWARD, "email_verified")

  return { alreadyVerified: false }
}