import { prisma } from "@/lib/prisma"
import { TaskType } from "@/generated/prisma/client"

export const createTask = async (data: {
  user_plant_id: string
  task_type: TaskType
  frequency_days: number
  next_due_at: Date
}) => {
  return prisma.userPlantTask.create({ data })
}

export const findTasksByPlant = async (userPlantId: string) => {
  return prisma.userPlantTask.findMany({
    where: { user_plant_id: userPlantId },
    orderBy: { next_due_at: "asc" }
  })
}

export const findTaskById = async (id: string) => {
  return prisma.userPlantTask.findUnique({
    where: { id },
    include: { user_plant: true }
  })
}

export const completeTask = async (id: string) => {
  const task = await prisma.userPlantTask.findUnique({ where: { id } })
  if (!task) return null

  const now = new Date()
  const nextDue = new Date(now)
  nextDue.setDate(nextDue.getDate() + task.frequency_days)

  return prisma.userPlantTask.update({
    where: { id },
    data: {
      last_completed_at: now,
      next_due_at: nextDue
    }
  })
}

export const findTasksByUser = async (userId: string) => {
  return prisma.userPlantTask.findMany({
    where: { user_plant: { user_id: userId } },
    orderBy: { next_due_at: "asc" },
    include: { user_plant: true }
  })
}

export const updateTask = async (id: string, data: {
  frequency_days?: number
  next_due_at?: Date
}) => {
  return prisma.userPlantTask.update({
    where: { id },
    data
  })
}

export const deleteTask = async (id: string) => {
  return prisma.userPlantTask.delete({ where: { id } })
}