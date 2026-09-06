import { z } from "zod"
import { AppError } from "@/core/errors/AppError"
import { findSpeciesById } from "@/infrastructure/repositories/plant-species.repository"
import { createUserPlant } from "@/infrastructure/repositories/user-plant.repository"
import { createTask } from "@/infrastructure/repositories/task.repository"
import { createCareLog } from "@/infrastructure/repositories/care-log.repository"

const createUserPlantSchema = z.object({
  species_id: z.string().uuid(),
  nickname: z.string().min(1).max(50).optional(),
  health_status: z.enum(["excellent", "good", "fair", "poor", "critical"]).optional(),
  acquired_at: z.coerce.date().optional(),
  // Cuándo se regó por última vez ANTES de registrarla en la app. Sin este
  // dato hay que asumir que el ciclo empieza hoy, lo que retrasa el primer
  // recordatorio en plantas que el usuario ya llevaba tiempo cuidando.
  last_watered_at: z.coerce.date().optional()
})

const MS_PER_DAY = 24 * 60 * 60 * 1000

export const createUserPlantUseCase = async (userId: string, input: unknown) => {
  const data = createUserPlantSchema.parse(input)
  const species = await findSpeciesById(data.species_id)
  if (!species) throw new AppError("Species not found", 404)

  // Una fecha de riego en el futuro no tiene sentido y desplazaría el
  // recordatorio hacia adelante indefinidamente, así que la ignoramos.
  const now = new Date()
  const lastWateredAt =
    data.last_watered_at && data.last_watered_at <= now ? data.last_watered_at : undefined

  const plant = await createUserPlant(userId, { ...data, last_watered_at: lastWateredAt })

  // Sin esta tarea la planta nunca genera recordatorios: runRemindersUseCase
  // solo mira UserPlantTask, así que una planta sin tarea es invisible para
  // las notificaciones aunque la app marque "¡Riego!" en su tarjeta (ese
  // badge se calcula aparte, en el cliente).
  //
  // El próximo riego se cuenta desde el último riego real si el usuario lo
  // indicó; si no, desde ahora. Una planta que ya venía vencida queda con
  // next_due_at en el pasado y entra en el primer barrido de recordatorios.
  const reference = lastWateredAt ?? now
  await createTask({
    user_plant_id: plant.id,
    task_type: "watering",
    frequency_days: species.water_frequency_days,
    next_due_at: new Date(reference.getTime() + species.water_frequency_days * MS_PER_DAY)
  })

  // Si el usuario indicó un riego previo, queda registrado también en el
  // historial. Sin esto la planta aparecía como regada y "al día" mientras su
  // historial de cuidados salía vacío, que es justo la contradicción que el
  // usuario no puede explicarse mirando la app.
  if (lastWateredAt) {
    await createCareLog({
      user_plant_id: plant.id,
      task_type: "watering",
      performed_at: lastWateredAt
    })
  }

  return plant
}