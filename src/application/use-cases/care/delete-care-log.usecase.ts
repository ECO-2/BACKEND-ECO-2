import { AppError } from "@/core/errors/AppError"
import { findCareLogById, deleteCareLog } from "@/infrastructure/repositories/care-log.repository"

export const deleteCareLogUseCase = async (userId: string, logId: string) => {
  const log = await findCareLogById(logId)
  if (!log) throw new AppError("Care log not found", 404)
  if (log.user_plant.user_id !== userId) throw new AppError("Care log not found", 404)

  await deleteCareLog(logId)
}