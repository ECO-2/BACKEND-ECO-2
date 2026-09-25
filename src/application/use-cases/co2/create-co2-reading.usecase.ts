import { z } from "zod"
import { AppError } from "@/core/errors/AppError"
import { createCo2Reading, findLatestCo2Reading } from "@/infrastructure/repositories/co2-reading.repository"
import { findUserById } from "@/infrastructure/repositories/user.repository"
import { notifyUser } from "@/infrastructure/services/notification.service"

const schema = z.object({
  user_id: z.string().uuid(),
  co2_ppm: z.number().int().min(0)
})

const HIGH_CO2_THRESHOLD_PPM = 2000
// Hay que bajar de este valor (no solo del umbral) para que una lectura alta
// vuelva a contar como "recién sube" y dispare otra alerta. Evita reavisar
// en cada lectura mientras el valor oscila justo alrededor de 2000.
const HIGH_CO2_RESET_PPM = 1800

export const createCo2ReadingUseCase = async (input: unknown) => {
  const data = schema.parse(input)

  const user = await findUserById(data.user_id)
  if (!user) throw new AppError("User not found", 404)

  const previous = await findLatestCo2Reading(data.user_id)
  const reading = await createCo2Reading(data)

  const wasAlreadyHigh = previous !== null && previous.co2_ppm >= HIGH_CO2_RESET_PPM
  const isNowHigh = data.co2_ppm >= HIGH_CO2_THRESHOLD_PPM

  if (isNowHigh && !wasAlreadyHigh) {
    await notifyUser(user.id, {
      title: "Aire cargado ⚠️",
      body: `El CO2 llegó a ${data.co2_ppm} ppm. Ventila el ambiente.`
    })
  }

  return reading
}