import { findUserByEmail } from "@/infrastructure/repositories/user.repository"
import { comparePassword } from "@/utils/hash"

export interface AdminAuthenticatedUser {
  email: string
  id: string
}

/**
 * Reuses the same credential store as the regular API login (User table +
 * bcrypt password_hash) instead of a separate hardcoded admin account, plus
 * an explicit `role === "admin"` check — a valid user/password pair that
 * isn't flagged as admin still gets rejected here.
 */
export async function authenticateAdmin(
  email?: string,
  password?: string,
): Promise<AdminAuthenticatedUser | null> {
  if (!email || !password) return null

  const user = await findUserByEmail(email)
  if (!user || !user.password_hash) return null
  if (user.role !== "admin") return null

  const isValid = await comparePassword(password, user.password_hash)
  if (!isValid) return null

  return { email: user.email, id: user.id }
}
