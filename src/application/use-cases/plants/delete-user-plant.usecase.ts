import { AppError } from "@/core/errors/AppError"
import { findUserPlantById, softDeleteUserPlant } from "@/infrastructure/repositories/user-plant.repository"

export const deleteUserPlantUseCase = async (userId: string, plantId: string) => {
  const plant = await findUserPlantById(plantId, userId)
  if (!plant) throw new AppError("Plant not found", 404)
  await softDeleteUserPlant(plantId)
}