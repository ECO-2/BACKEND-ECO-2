import { z } from "zod"
import { AppError } from "@/core/errors/AppError"
import { levelProgress } from "@/domain/gamification/levels"
import {
  findUserProgress,
  upsertUserProgress,
  addXp,
  addSeeds,
  findXpLogs,
  findSeedTransactions
} from "@/infrastructure/repositories/gamification.repository"

const addXpSchema = z.object({
  amount: z.number().int().min(1),
  action_type: z.string().min(1)
})

const addSeedsSchema = z.object({
  amount: z.number().int(),
  reason: z.string().min(1)
})

const updateProgressSchema = z.object({
  xp: z.number().int().min(0).optional(),
  level: z.number().int().min(1).optional(),
  streak_days: z.number().int().min(0).optional(),
  seeds: z.number().int().min(0).optional()
})

export const getProgressUseCase = async (userId: string) => {
  const progress = await findUserProgress(userId)

  // Se devuelve el nivel derivado del XP junto al progreso hacia el siguiente,
  // para que la app no tenga que duplicar la curva de niveles ni recurrir a
  // textos fijos como el "Nivel 2 · Brote" que estaba escrito a mano.
  const base = progress ?? { user_id: userId, xp: 0, level: 1, streak_days: 0, seeds: 0 }
  const derived = levelProgress(base.xp)

  return {
    ...base,
    // El nivel autoritativo es el derivado del XP: si una fila quedó con un
    // `level` desincronizado (p. ej. editada a mano antes de existir esta
    // curva), manda el XP.
    level: derived.level,
    level_name: derived.name,
    xp_into_level: derived.xp_into_level,
    xp_for_next: derived.xp_for_next,
    next_level_name: derived.next_level_name,
    level_progress: Number(derived.progress.toFixed(4))
  }
}

export const addXpUseCase = async (userId: string, input: unknown) => {
  const data = addXpSchema.parse(input)
  return addXp(userId, data.amount, data.action_type)
}

export const addSeedsUseCase = async (userId: string, input: unknown) => {
  const data = addSeedsSchema.parse(input)
  return addSeeds(userId, data.amount, data.reason)
}

export const updateProgressUseCase = async (userId: string, input: unknown) => {
  const data = updateProgressSchema.parse(input)
  if (Object.keys(data).length === 0) throw new AppError("No fields to update", 400)
  return upsertUserProgress(userId, data)
}

export const getXpLogsUseCase = async (userId: string) => {
  return findXpLogs(userId)
}

export const getSeedTransactionsUseCase = async (userId: string) => {
  return findSeedTransactions(userId)
}