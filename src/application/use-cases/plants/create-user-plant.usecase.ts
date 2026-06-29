import { z } from "zod"
import { AppError } from "@/core/errors/AppError"
import { findSpeciesById } from "@/infrastructure/repositories/plant-species.repository"
import { createUserPlant } from "@/infrastructure/repositories/user-plant.repository"

const createUserPlantSchema = z.object({
  species_id: z.string().uuid(),
  nickname: z.string().min(1).max(50).optional(),
  health_status: z.enum(["excellent", "good", "fair", "poor", "critical"]).optional(),
  acquired_at: z.coerce.date().optional()
})

export const createUserPlantUseCase = async (userId: string, input: unknown) => {
  const data = createUserPlantSchema.parse(input)
  const species = await findSpeciesById(data.species_id)
  if (!species) throw new AppError("Species not found", 404)
  return createUserPlant(userId, data)
}