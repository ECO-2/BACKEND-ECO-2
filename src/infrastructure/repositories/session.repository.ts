import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export const createSession = async (userId: string) => {
  const rawToken = crypto.randomBytes(40).toString("hex")
  const tokenHash = hashToken(rawToken)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await prisma.session.create({
    data: {
      user_id: userId,      
      token_hash: tokenHash,
      expires_at: expiresAt,
    }
  })

  return rawToken
}

export const findSessionByToken = async (rawToken: string) => {
  const tokenHash = hashToken(rawToken)
  return prisma.session.findUnique({
    where: { token_hash: tokenHash }
  })
}

export const revokeSession = async (rawToken: string) => {
  const tokenHash = hashToken(rawToken)
  return prisma.session.update({
    where: { token_hash: tokenHash },
    data: { revoked_at: new Date() }
  })
}