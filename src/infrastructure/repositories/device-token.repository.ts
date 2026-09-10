import { prisma } from "@/lib/prisma"

export const upsertDeviceToken = async (userId: string, token: string) => {
  return prisma.deviceToken.upsert({
    where: { token },
    update: { user_id: userId },
    create: { user_id: userId, token }
  })
}

export const findDeviceTokensByUser = async (userId: string) => {
  return prisma.deviceToken.findMany({ where: { user_id: userId } })
}

export const deleteDeviceToken = async (token: string) => {
  return prisma.deviceToken.deleteMany({ where: { token } })
}