import { z } from "zod"
import { AppError } from "../../core/errors/AppError"
import { verifyFirebaseToken } from "../../infrastructure/repositories/firebase.repository"
import { findUserByEmail, createUser, markEmailVerifiedIfPending  } from "../../infrastructure/repositories/user.repository"
import { createSession } from "../../infrastructure/repositories/session.repository"
import { generateAccessToken } from "../../utils/jwt"
import { addSeeds } from "../../infrastructure/repositories/gamification.repository"
import { VERIFY_SEED_REWARD } from "./verify-email.usecase"

const firebaseLoginSchema = z.object({
  idToken: z.string().min(1)
})

export const firebaseLogin = async (input: unknown) => {
  const data = firebaseLoginSchema.parse(input)

  const decoded = await verifyFirebaseToken(data.idToken)

  if (!decoded) {
    throw new AppError("Invalid Firebase token", 401)
  }

  const email = decoded.email

  if (!email) {
    throw new AppError("Firebase account has no email", 400)
  }

  const googleVerified = decoded.email_verified === true

  let user = await findUserByEmail(email)

  if (!user) {
    user = await createUser({
      email,
      username: decoded.name ?? null,
      password_hash: null,
      provider: "firebase",
      provider_id: decoded.uid,
      email_verified: googleVerified,
    })
    if (googleVerified) {
      await addSeeds(user.id, VERIFY_SEED_REWARD, "email_verified")
    }
  } else if (googleVerified && !user.email_verified) {
    const verifiedNow = await markEmailVerifiedIfPending(user.id)
    if (verifiedNow) {
      await addSeeds(user.id, VERIFY_SEED_REWARD, "email_verified")
    }
  }

  // 4. Emitir tus propios tokens — igual que el login local
  const accessToken = generateAccessToken({ sub: user.id, email: user.email, role: user.role })
  const refreshToken = await createSession(user.id)

  return { accessToken, refreshToken }
}