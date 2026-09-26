import { findLatestCo2Reading } from "@/infrastructure/repositories/co2-reading.repository"

export const getLatestCo2ReadingUseCase = async (userId: string) => {
  return findLatestCo2Reading(userId)
}