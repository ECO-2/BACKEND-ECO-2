import { findTasksByUser } from "@/infrastructure/repositories/task.repository"

export const getAllTasksUseCase = async (userId: string) => {
  return findTasksByUser(userId)
}