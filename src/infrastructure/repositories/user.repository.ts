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

export const updateUserPassword = async (userId: string, password_hash: string) => {
  return prisma.user.update({
    where: { id: userId },
    data: { password_hash }
  })
}

export const setResetTokenHash = async (userId: string, hash: string | null) => {
  return prisma.user.update({
    where: { id: userId },
    data: { reset_token_hash: hash }
  })
}

// La columna guarda `<vencimientoEnMs>.<sha256>`, así que se busca por el
// sufijo. El hash es un sha256 completo: no colisiona en la práctica, y la
// tabla de usuarios es pequeña, de modo que el escaneo no pesa.
export const findUserByResetTokenHash = async (hash: string) => {
  return prisma.user.findFirst({
    where: { reset_token_hash: { endsWith: `.${hash}` } }
  })
}

export const deleteUserAndData = async (userId: string) => {
  return prisma.$transaction(async (tx) => {
    await tx.careLog.deleteMany({ where: { user_plant: { user_id: userId } } })
    await tx.userPlantTask.deleteMany({ where: { user_plant: { user_id: userId } } })
    await tx.userPlant.deleteMany({ where: { user_id: userId } })
    await tx.plantIdentification.deleteMany({ where: { user_id: userId } })
    await tx.userAchievement.deleteMany({ where: { user_id: userId } })
    await tx.xpLog.deleteMany({ where: { user_id: userId } })
    await tx.seedTransaction.deleteMany({ where: { user_id: userId } })
    await tx.userProgress.deleteMany({ where: { user_id: userId } })
    await tx.session.deleteMany({ where: { user_id: userId } })
    await tx.room.deleteMany({ where: { user_id: userId } })
    await tx.user.delete({ where: { id: userId } })
  })
}