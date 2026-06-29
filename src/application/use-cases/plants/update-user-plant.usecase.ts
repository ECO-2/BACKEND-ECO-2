import { z } from "zod"
import { AppError } from "@/core/errors/AppError"
import { findUserPlantById, updateUserPlant } from "@/infrastructure/repositories/user-plant.repository"

const updateUserPlantSchema = z.object({
  nickname: z.string().min(1).max(50).optional(),
  health_status: z.enum(["excellent", "good", "fair", "poor", "critical"]).optional(),
  last_watered_at: z.coerce.date().optional()
})

export const updateUserPlantUseCase = async (userId: string, plantId: string, input: unknown) => {
  const data = updateUserPlantSchema.parse(input)
  const plant = await findUserPlantById(plantId, userId)
  if (!plant) throw new AppError("Plant not found", 404)
  return updateUserPlant(plantId, data)
}