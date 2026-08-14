import { z } from "zod"
import { AppError } from "@/core/errors/AppError"
import { findUserPlantById } from "@/infrastructure/repositories/user-plant.repository"
import { createTask } from "@/infrastructure/repositories/task.repository"

const createTaskSchema = z.object({
  user_plant_id: z.string().uuid(),
  task_type: z.enum(["watering", "fertilizing", "pruning", "repotting", "misting", "cleaning"]),
  frequency_days: z.number().int().min(1),
  next_due_at: z.coerce.date()
})

export const createTaskUseCase = async (userId: string, input: unknown) => {
  const data = createTaskSchema.parse(input)
  const plant = await findUserPlantById(data.user_plant_id, userId)
  if (!plant) throw new AppError("Plant not found", 404)
  return createTask(data)
}