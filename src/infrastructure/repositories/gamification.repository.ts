import { prisma } from "@/lib/prisma"

// USER PROGRESS
export const findUserProgress = async (userId: string) => {
  return prisma.userProgress.findUnique({ where: { user_id: userId } })
}

export const upsertUserProgress = async (userId: string, data: {
  xp?: number
  level?: number
  streak_days?: number
  seeds?: number
}) => {
  return prisma.userProgress.upsert({
    where: { user_id: userId },
    create: { user_id: userId, ...data },
    update: data
  })
}

export const addXp = async (userId: string, amount: number, actionType: string) => {
  const progress = await prisma.userProgress.upsert({
    where: { user_id: userId },
    create: { user_id: userId, xp: amount },
    update: { xp: { increment: amount } }
  })

  await prisma.xpLog.create({
    data: { user_id: userId, action_type: actionType, xp_earned: amount }
  })

  return progress
}

export const addSeeds = async (userId: string, amount: number, reason: string) => {
  const progress = await prisma.userProgress.upsert({
    where: { user_id: userId },
    create: { user_id: userId, seeds: amount },
    update: { seeds: { increment: amount } }
  })

  await prisma.seedTransaction.create({
    data: { user_id: userId, amount, reason }
  })

  return progress
}

export const findXpLogs = async (userId: string) => {
  return prisma.xpLog.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" }
  })
}

export const findSeedTransactions = async (userId: string) => {
  return prisma.seedTransaction.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" }
  })
}

// ACHIEVEMENTS
export const findAllAchievements = async () => {
  return prisma.achievement.findMany({ orderBy: { name: "asc" } })
}

export const findAchievementById = async (id: string) => {
  return prisma.achievement.findUnique({ where: { id } })
}

export const createAchievement = async (data: {
  name: string
  description: string
  condition_type: string
  condition_value: number
  xp_reward: number
  seed_reward?: number
  icon_url?: string
}) => {
  return prisma.achievement.create({ data })
}

export const updateAchievement = async (id: string, data: {
  name?: string
  description?: string
  condition_type?: string
  condition_value?: number
  xp_reward?: number
  seed_reward?: number
  icon_url?: string
}) => {
  return prisma.achievement.update({ where: { id }, data })
}

export const findUserAchievements = async (userId: string) => {
  return prisma.userAchievement.findMany({
    where: { user_id: userId },
    include: { achievement: true },
    orderBy: { unlocked_at: "desc" }
  })
}

/// Desbloquea un logro y, en la misma transacción, acredita su xp_reward y
/// seed_reward al progreso del usuario (antes el desbloqueo solo dejaba
/// constancia de que se ganó el logro, sin sumar nada realmente).
export const unlockAchievement = async (
  userId: string,
  achievement: { id: string; name: string; xp_reward: number; seed_reward: number }
) => {
  return prisma.$transaction(async (tx) => {
    const userAchievement = await tx.userAchievement.create({
      data: { user_id: userId, achievement_id: achievement.id },
      include: { achievement: true }
    })

    if (achievement.xp_reward > 0 || achievement.seed_reward > 0) {
      await tx.userProgress.upsert({
        where: { user_id: userId },
        create: { user_id: userId, xp: achievement.xp_reward, seeds: achievement.seed_reward },
        update: {
          xp: { increment: achievement.xp_reward },
          seeds: { increment: achievement.seed_reward }
        }
      })
    }

    if (achievement.xp_reward > 0) {
      await tx.xpLog.create({
        data: { user_id: userId, action_type: "achievement_unlock", xp_earned: achievement.xp_reward }
      })
    }

    if (achievement.seed_reward > 0) {
      await tx.seedTransaction.create({
        data: { user_id: userId, amount: achievement.seed_reward, reason: `achievement:${achievement.name}` }
      })
    }

    return userAchievement
  })
}

export const findUserAchievement = async (userId: string, achievementId: string) => {
  return prisma.userAchievement.findUnique({
    where: { user_id_achievement_id: { user_id: userId, achievement_id: achievementId } }
  })
}