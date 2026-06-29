import { AppError } from "@/core/errors/AppError"
import { findTaskById, completeTask } from "@/infrastructure/repositories/task.repository"
import { createCareLog } from "@/infrastructure/repositories/care-log.repository"
import { findUserPlantById } from "@/infrastructure/repositories/user-plant.repository"

export const completeTaskUseCase = async (userId: string, taskId: string) => {
  const task = await findTaskById(taskId)
  if (!task) throw new AppError("Task not found", 404)

  // Verifica que la planta pertenece al usuario
  const plant = await findUserPlantById(task.user_plant_id, userId)
  if (!plant) throw new AppError("Task not found", 404)

  const completed = await completeTask(taskId)

  // Crea el care log automáticamente
  await createCareLog({
    user_plant_id: task.user_plant_id,
    task_type: task.task_type,
    task_id: taskId
  })

  return completed
}