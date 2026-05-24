import { z } from "zod"
import { AppError } from "../../core/errors/AppError"
import { verifyFirebaseToken } from "../../infrastructure/repositories/firebase.repository"
import { findUserByEmail, createUser } from "../../infrastructure/repositories/user.repository"
import { createSession } from "../../infrastructure/repositories/session.repository"
import { generateAccessToken } from "../../utils/jwt"

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

  let user = await findUserByEmail(email)

  if (!user) {
    user = await createUser({
      email,
      password_hash: null,
      provider: "firebase",
      provider_id: decoded.uid,
    })
  }

  // 4. Emitir tus propios tokens — igual que el login local
  const accessToken = generateAccessToken({ sub: user.id, email: user.email })
  const refreshToken = await createSession(user.id)

  return { accessToken, refreshToken }
}