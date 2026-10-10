import { prisma } from "@/lib/prisma"
import { TaskType } from "@/generated/prisma/client"

export const createCareLog = async (data: {
  user_plant_id: string
  task_type: TaskType
  task_id?: string
  performed_at?: Date
}) => {
  return prisma.careLog.create({
    data: {
      user_plant_id: data.user_plant_id,
      task_type: data.task_type,
      task_id: data.task_id ?? null,
      performed_at: data.performed_at ?? new Date()
    }
  })
}

export const findCareLogsByPlant = async (userPlantId: string) => {
  return prisma.careLog.findMany({
    where: { user_plant_id: userPlantId },
    orderBy: { performed_at: "desc" }
  })
}

export const findCareLogById = async (id: string) => {
  return prisma.careLog.findUnique({
    where: { id },
    include: { user_plant: true }
  })
}

export const deleteCareLog = async (id: string) => {
  return prisma.careLog.delete({ where: { id } })
}

export const findRecentCareLog = async (userPlantId: string, taskType: TaskType, since: Date) => {
  return prisma.careLog.findFirst({
    where: { user_plant_id: userPlantId, task_type: taskType, performed_at: { gte: since } },
    orderBy: { performed_at: "desc" }
  })
}