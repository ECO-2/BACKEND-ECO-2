import { AppError } from "@/core/errors/AppError"
import { findUserPlantById } from "@/infrastructure/repositories/user-plant.repository"
import { findCareLogsByPlant } from "@/infrastructure/repositories/care-log.repository"

export const getCareLogsUseCase = async (userId: string, userPlantId: string) => {
  const plant = await findUserPlantById(userPlantId, userId)
  if (!plant) throw new AppError("Plant not found", 404)
  return findCareLogsByPlant(userPlantId)
}