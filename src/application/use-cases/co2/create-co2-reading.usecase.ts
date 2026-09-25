import { z } from "zod"
import { AppError } from "@/core/errors/AppError"
import { createCo2Reading } from "@/infrastructure/repositories/co2-reading.repository"
import { findUserById } from "@/infrastructure/repositories/user.repository"

const schema = z.object({
  user_id: z.string().uuid(),
  co2_ppm: z.number().int().min(0)
})

export const createCo2ReadingUseCase = async (input: unknown) => {
  const data = schema.parse(input)

  const user = await findUserById(data.user_id)
  if (!user) throw new AppError("User not found", 404)

  return createCo2Reading(data)
}