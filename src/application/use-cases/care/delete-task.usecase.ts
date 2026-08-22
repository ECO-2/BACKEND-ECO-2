import { AppError } from "@/core/errors/AppError"
import { findTaskById, deleteTask } from "@/infrastructure/repositories/task.repository"

export const deleteTaskUseCase = async (userId: string, taskId: string) => {
  const task = await findTaskById(taskId)
  if (!task) throw new AppError("Task not found", 404)
  if (task.user_plant.user_id !== userId) throw new AppError("Task not found", 404)

  await deleteTask(taskId)
}