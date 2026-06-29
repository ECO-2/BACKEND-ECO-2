import { z } from "zod"
import { AppError } from "@/core/errors/AppError"
import { findUserPlantById } from "@/infrastructure/repositories/user-plant.repository"
import { createCareLog } from "@/infrastructure/repositories/care-log.repository"

const careLogSchema = z.object({
  user_plant_id: z.string().uuid(),
  task_type: z.enum(["watering", "fertilizing", "pruning", "repotting", "misting", "cleaning"]),
  performed_at: z.coerce.date().optional()
})

export const createCareLogUseCase = async (userId: string, input: unknown) => {
  const data = careLogSchema.parse(input)
  const plant = await findUserPlantById(data.user_plant_id, userId)
  if (!plant) throw new AppError("Plant not found", 404)
  return createCareLog(data)
}