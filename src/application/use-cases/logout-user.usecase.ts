import { AppError } from "@/core/errors/AppError"
import { findSessionByToken, revokeSession } from "@/infrastructure/repositories/session.repository"

export const logoutUser = async (input: unknown) => {
  if (!input || typeof input !== "object" || !("refreshToken" in input)) {
    throw new AppError("Refresh token required", 400)
  }

  const { refreshToken: rawToken } = input as { refreshToken: string }

  const session = await findSessionByToken(rawToken)

  if (!session || session.revoked_at) {
    return
  }

  await revokeSession(rawToken)
}