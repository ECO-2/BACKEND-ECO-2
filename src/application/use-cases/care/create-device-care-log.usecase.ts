import { z } from "zod"
import { AppError } from "@/core/errors/AppError"
import { findUserPlantById, updateUserPlant } from "@/infrastructure/repositories/user-plant.repository"
import { findRecentCareLog } from "@/infrastructure/repositories/care-log.repository"
import { createCareLogUseCase } from "@/application/use-cases/care/create-care-log.usecase"

const deviceCareLogSchema = z.object({
  user_id: z.string().uuid(),
  user_plant_id: z.string().uuid(),
  moisture_raw: z.number().int().min(0).optional(),
  pump_duration_ms: z.number().int().min(0).optional()
})

const DUPLICATE_WINDOW_MS = 60 * 1000

export const createDeviceCareLogUseCase = async (input: unknown) => {
  const data = deviceCareLogSchema.parse(input)

  const plant = await findUserPlantById(data.user_plant_id, data.user_id)
  if (!plant) throw new AppError("Plant not found", 404)

  const since = new Date(Date.now() - DUPLICATE_WINDOW_MS)
  const existing = await findRecentCareLog(plant.id, "watering", since)
  if (existing) return { log: existing, created: false }

  const log = await createCareLogUseCase(data.user_id, {
    user_plant_id: plant.id,
    task_type: "watering"
  })
  await updateUserPlant(plant.id, { last_watered_at: log.performed_at })

  return { log, created: true }
}