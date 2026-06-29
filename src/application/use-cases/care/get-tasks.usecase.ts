import { AppError } from "@/core/errors/AppError"
import { findUserPlantById } from "@/infrastructure/repositories/user-plant.repository"
import { findTasksByPlant } from "@/infrastructure/repositories/task.repository"

export const getTasksUseCase = async (userId: string, userPlantId: string) => {
  const plant = await findUserPlantById(userPlantId, userId)
  if (!plant) throw new AppError("Plant not found", 404)
  return findTasksByPlant(userPlantId)
}