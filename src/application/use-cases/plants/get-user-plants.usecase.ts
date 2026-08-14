import { findUserPlants, findUserPlantById } from "@/infrastructure/repositories/user-plant.repository"
import { AppError } from "@/core/errors/AppError"

export const getUserPlantsUseCase = async (userId: string) => {
  return findUserPlants(userId)
}

export const getUserPlantByIdUseCase = async (userId: string, plantId: string) => {
  const plant = await findUserPlantById(plantId, userId)
  if (!plant) throw new AppError("Plant not found", 404)
  return plant
}