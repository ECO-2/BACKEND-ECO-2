import { AppError } from "@/core/errors/AppError"
import { findSessionByToken, revokeSession, createSession } from "@/infrastructure/repositories/session.repository"
import { findUserById } from "@/infrastructure/repositories/user.repository"
import { generateAccessToken } from "@/utils/jwt"

export const refreshToken = async (input: unknown) => {
  if (!input || typeof input !== "object" || !("refreshToken" in input)) {
    throw new AppError("Refresh token required", 400)
  }

  const { refreshToken: rawToken } = input as { refreshToken: string }

  const session = await findSessionByToken(rawToken)

  if (!session) {
    throw new AppError("Invalid refresh token", 401)
  }

  if (session.revoked_at) {
    throw new AppError("Refresh token revoked", 401)
  }

  if (session.expires_at < new Date()) {
    throw new AppError("Refresh token expired", 401)
  }

  const user = await findUserById(session.user_id)

  if (!user) {
    throw new AppError("User not found", 404)
  }

  await revokeSession(rawToken)
  const newRefreshToken = await createSession(user.id)
  const accessToken = generateAccessToken({ sub: user.id, email: user.email })

  return { accessToken, refreshToken: newRefreshToken }
}