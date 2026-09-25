import { prisma } from "@/lib/prisma"

export const createCo2Reading = async (data: { user_id: string; co2_ppm: number }) => {
  return prisma.co2Reading.create({ data })
}

export const findLatestCo2Reading = async (userId: string) => {
  return prisma.co2Reading.findFirst({
    where: { user_id: userId },
    orderBy: { recorded_at: "desc" }
  })
}

export const findCo2Readings = async (userId: string) => {
  return prisma.co2Reading.findMany({
    where: { user_id: userId },
    orderBy: { recorded_at: "desc" }
  })
}