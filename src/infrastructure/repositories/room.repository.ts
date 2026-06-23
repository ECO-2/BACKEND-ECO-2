import { prisma } from "@/lib/prisma"

export const createRoom = async (userId: string, data: {
  name: string
  size_m2?: number
  light_level?: "low" | "medium" | "high"
}) => {
  return prisma.room.create({
    data: {
      user_id: userId,
      name: data.name,
      size_m2: data.size_m2,
      light_level: data.light_level
    }
  })
}

export const findRoomsByUser = async (userId: string) => {
  return prisma.room.findMany({
    where: { user_id: userId, deleted_at: null },
    orderBy: { created_at: "desc" }
  })
}

export const findRoomById = async (id: string, userId: string) => {
  return prisma.room.findFirst({
    where: { id, user_id: userId, deleted_at: null }
  })
}

export const updateRoom = async (id: string, data: {
  name?: string
  size_m2?: number
  light_level?: "low" | "medium" | "high"
}) => {
  return prisma.room.update({
    where: { id },
    data
  })
}

export const softDeleteRoom = async (id: string) => {
  return prisma.room.update({
    where: { id },
    data: { deleted_at: new Date() }
  })
}