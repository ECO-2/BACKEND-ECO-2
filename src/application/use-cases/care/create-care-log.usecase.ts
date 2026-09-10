import { z } from "zod"
import { AppError } from "@/core/errors/AppError"
import { findUserPlantById } from "@/infrastructure/repositories/user-plant.repository"
import { createCareLog } from "@/infrastructure/repositories/care-log.repository"
import { findTasksByPlant, completeTask } from "@/infrastructure/repositories/task.repository"
import { refreshStreak } from "@/application/use-cases/gamification/update-streak.usecase"

const careLogSchema = z.object({
  user_plant_id: z.string().uuid(),
  task_type: z.enum(["watering", "fertilizing", "pruning", "repotting", "misting", "cleaning"]),
  performed_at: z.coerce.date().optional()
})

export const createCareLogUseCase = async (userId: string, input: unknown) => {
  const data = careLogSchema.parse(input)
  const plant = await findUserPlantById(data.user_plant_id, userId)
  if (!plant) throw new AppError("Plant not found", 404)

  const log = await createCareLog(data)

  // La app registra el cuidado como CareLog directamente, sin pasar por
  // PATCH /care/tasks/:id/complete, así que la tarea correspondiente se
  // quedaba vencida para siempre y seguía disparando recordatorios aunque
  // el usuario ya hubiera regado. Aquí la reprogramamos.
  const tasks = await findTasksByPlant(data.user_plant_id)
  const matchingTask = tasks.find(t => t.task_type === data.task_type)
  if (matchingTask) await completeTask(matchingTask.id)

  // La racha se recalcula a partir de los cuidados reales. Antes streak_days
  // existía y se mostraba, pero nadie lo actualizaba: siempre marcaba 0.
  await refreshStreak(userId)

  return log
}