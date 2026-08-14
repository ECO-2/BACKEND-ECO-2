import { z } from "zod"
import { AppError } from "@/core/errors/AppError"
import {
  findAllAchievements,
  findAchievementById,
  createAchievement,
  updateAchievement,
  findUserAchievements,
  unlockAchievement,
  findUserAchievement
} from "@/infrastructure/repositories/gamification.repository"

const achievementSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1),
  condition_type: z.string().min(1),
  condition_value: z.number().int().min(0),
  xp_reward: z.number().int().min(0),
  seed_reward: z.number().int().min(0).optional(),
  icon_url: z.string().url().optional()
})

const updateAchievementSchema = achievementSchema.partial()

export const getAllAchievementsUseCase = async () => {
  return findAllAchievements()
}

export const createAchievementUseCase = async (input: unknown) => {
  const data = achievementSchema.parse(input)
  return createAchievement(data)
}

export const updateAchievementUseCase = async (id: string, input: unknown) => {
  const data = updateAchievementSchema.parse(input)
  const existing = await findAchievementById(id)
  if (!existing) throw new AppError("Achievement not found", 404)
  return updateAchievement(id, data)
}

export const getUserAchievementsUseCase = async (userId: string) => {
  return findUserAchievements(userId)
}

export const unlockAchievementUseCase = async (userId: string, achievementId: string) => {
  const achievement = await findAchievementById(achievementId)
  if (!achievement) throw new AppError("Achievement not found", 404)

  const already = await findUserAchievement(userId, achievementId)
  if (already) throw new AppError("Achievement already unlocked", 409)

  return unlockAchievement(userId, {
    id: achievement.id,
    name: achievement.name,
    xp_reward: achievement.xp_reward,
    seed_reward: achievement.seed_reward
  })
}