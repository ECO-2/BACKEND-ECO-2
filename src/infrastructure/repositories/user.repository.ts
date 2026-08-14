import { prisma } from "@/lib/prisma"

export const createUser = async (data: {
  email: string
  username?: string | null
  password_hash: string | null
  provider?: string
  provider_id?: string | null
}) => {
  return prisma.user.create({
    data: {
      email: data.email,
      username: data.username ?? null,
      password_hash: data.password_hash,
      provider: data.provider ?? "local",
      provider_id: data.provider_id ?? null,
    }
  })
}

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email }
  })
}

export const findUserById = async (id: string) => {
  return prisma.user.findUnique({ where: { id } })
}

export const findUserByUsername = async (username: string) => {
  return prisma.user.findUnique({ where: { username } })
}

export const updateUserOnboarding = async (
  userId: string,
  data: {
    username?: string
    gender?: "male" | "female" | "other" | "prefer_not_to_say"
    birth_day?: Date
    onboarding_completed: boolean
  }
) => {
  return prisma.user.update({
    where: { id: userId },
    data
  })
}

export const updateUserProfile = async (
  userId: string,
  data: {
    username?: string
    notifications_enabled?: boolean
    reminder_start_hour?: number
    reminder_end_hour?: number
  }
) => {
  return prisma.user.update({
    where: { id: userId },
    data
  })
}