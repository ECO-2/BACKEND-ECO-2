import crypto from "crypto"

export const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000

export const generateVerifyToken = (): string =>
  crypto.randomBytes(32).toString("hex")

export const hashVerifyToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex")

export const packVerifyToken = (token: string, now = Date.now()): string =>
  `${now + VERIFY_TOKEN_TTL_MS}.${hashVerifyToken(token)}`

export const unpackVerifyToken = (
  stored: string
): { expiresAt: number; hash: string } | null => {
  const separator = stored.indexOf(".")
  if (separator < 0) return null
  const expiresAt = Number(stored.slice(0, separator))
  const hash = stored.slice(separator + 1)
  if (!Number.isFinite(expiresAt) || !hash) return null
  return { expiresAt, hash }
}