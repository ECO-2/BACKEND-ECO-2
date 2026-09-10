import { z } from "zod"
import { AppError } from "@/core/errors/AppError"
import { findTaskById, updateTask } from "@/infrastructure/repositories/task.repository"

const updateTaskSchema = z.object({
  frequency_days: z.number().int().min(1).optional(),
  next_due_at: z.coerce.date().optional()
}).refine(data => data.frequency_days !== undefined || data.next_due_at !== undefined, {
  message: "At least one field must be provided"
})

export const updateTaskUseCase = async (userId: string, taskId: string, input: unknown) => {
  const data = updateTaskSchema.parse(input)

  const task = await findTaskById(taskId)
  if (!task) throw new AppError("Task not found", 404)
  if (task.user_plant.user_id !== userId) throw new AppError("Task not found", 404)

  return updateTask(taskId, data)
}