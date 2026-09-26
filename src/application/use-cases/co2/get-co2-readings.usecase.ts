import { findCo2Readings } from "@/infrastructure/repositories/co2-reading.repository"

export const getCo2ReadingsUseCase = async (userId: string) => {
  return findCo2Readings(userId)
}