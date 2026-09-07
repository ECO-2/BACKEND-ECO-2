import { prisma } from "@/lib/prisma"

export const createUserPlant = async (userId: string, data: {
  species_id: string
  nickname?: string
  health_status?: "excellent" | "good" | "fair" | "poor" | "critical"
  acquired_at?: Date
  last_watered_at?: Date
  reminders_muted?: boolean
}) => {
  return prisma.userPlant.create({
    data: {
      user_id: userId,
      species_id: data.species_id,
      nickname: data.nickname,
      health_status: data.health_status ?? "good",
      acquired_at: data.acquired_at ?? new Date(),
      last_watered_at: data.last_watered_at
    },
    include: { species: true }
  })
}

export const findUserPlants = async (userId: string) => {
  return prisma.userPlant.findMany({
    where: { user_id: userId, deleted_at: null },
    include: { species: true },
    orderBy: { created_at: "desc" }
  })
}

export const findUserPlantById = async (id: string, userId: string) => {
  return prisma.userPlant.findFirst({
    where: { id, user_id: userId, deleted_at: null },
    include: { species: true }
  })
}

export const updateUserPlant = async (id: string, data: {
  nickname?: string
  health_status?: "excellent" | "good" | "fair" | "poor" | "critical"
  last_watered_at?: Date
  reminders_muted?: boolean
}) => {
  return prisma.userPlant.update({
    where: { id },
    data,
    include: { species: true }
  })
}

export const softDeleteUserPlant = async (id: string) => {
  return prisma.userPlant.update({
    where: { id },
    data: { deleted_at: new Date() }
  })
}