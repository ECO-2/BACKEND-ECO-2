import { prisma } from "@/lib/prisma"
import { AppError } from "@/core/errors/AppError"
import {
  dailyScanLimit,
  isPlusActive,
  maxPlants,
  startOfToday,
  type PlanHolder
} from "@/domain/plans/limits"

/**
 * Comprobación de los topes del plan gratuito.
 *
 * Vive en la capa de aplicación y no en el dominio porque necesita contar en la
 * base; el dominio solo dice cuáles son los límites.
 */

const loadPlan = async (userId: string): Promise<PlanHolder> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan_type: true, plan_expires_at: true }
  })
  if (!user) throw new AppError("User not found", 404)
  return user
}

/** Plantas activas del usuario (las borradas no cuentan contra el tope). */
export const countActivePlants = (userId: string) =>
  prisma.userPlant.count({ where: { user_id: userId, deleted_at: null } })

/** Escaneos hechos hoy, en la zona horaria del servidor. */
export const countScansToday = (userId: string, now = new Date()) =>
  prisma.plantIdentification.count({
    where: { user_id: userId, created_at: { gte: startOfToday(now) } }
  })

/**
 * Lanza 403 si el usuario ya alcanzó su tope de plantas.
 *
 * El código `plant_limit_reached` viaja en el mensaje para que la app pueda
 * distinguirlo de otros 403 y ofrecer O2+ en vez de un error genérico.
 */
export const assertCanAddPlant = async (userId: string, now = new Date()) => {
  const plan = await loadPlan(userId)
  const limit = maxPlants(plan, now)
  if (limit === null) return

  const current = await countActivePlants(userId)
  if (current >= limit) {
    throw new AppError("plant_limit_reached", 403)
  }
}

/** Lanza 403 si el usuario ya gastó sus escaneos del día. */
export const assertCanScan = async (userId: string, now = new Date()) => {
  const plan = await loadPlan(userId)
  const limit = dailyScanLimit(plan, now)
  if (limit === null) return

  const used = await countScansToday(userId, now)
  if (used >= limit) {
    throw new AppError("scan_limit_reached", 403)
  }
}

/** Estado del plan y consumo actual, para pintarlo en la app. */
export const getPlanStatus = async (userId: string, now = new Date()) => {
  const plan = await loadPlan(userId)
  const plus = isPlusActive(plan, now)

  const [plants, scans] = await Promise.all([
    countActivePlants(userId),
    countScansToday(userId, now)
  ])

  return {
    plan_type: plan.plan_type,
    plan_expires_at: plan.plan_expires_at,
    is_plus_active: plus,
    plants_used: plants,
    plants_limit: maxPlants(plan, now),
    scans_used_today: scans,
    scans_limit: dailyScanLimit(plan, now)
  }
}
