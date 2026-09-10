import { prisma } from "@/lib/prisma"
import { AppError } from "@/core/errors/AppError"
import {
  activeRentalPots,
  dailyScanLimit,
  isPlusActive,
  legacyPotsFor,
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
    select: {
      plan_type: true,
      plan_expires_at: true,
      extra_plant_slots: true,
      rental_plant_slots: true,
      rental_slots_expires_at: true,
      legacy_plant_slots: true,
      plus_settled_at: true
    }
  })
  if (!user) throw new AppError("User not found", 404)
  return settleExpiredPlus(userId, user)
}

/**
 * Liquida una suscripcion O2+ recien caducada concediendo las macetas
 * heredadas.
 *
 * Se hace aqui, de forma perezosa, y no en una tarea programada: no hay nada
 * que ejecute trabajos periodicos en produccion, asi que un usuario podria
 * pasar semanas caducado sin que nadie le liquidara nada. Al colgarlo de la
 * lectura del plan, la concesion ocurre la primera vez que la app pregunta,
 * que es justo antes de que el tope pueda molestarle.
 *
 * `plus_settled_at` guarda la caducidad ya liquidada, de modo que renovar y
 * volver a caducar concede de nuevo, pero una sola vez por suscripcion.
 */
const settleExpiredPlus = async (
  userId: string,
  user: PlanHolder & { plus_settled_at?: Date | null },
  now = new Date()
): Promise<PlanHolder> => {
  const expiry = user.plan_expires_at
  const pending =
    expiry !== null &&
    expiry <= now &&
    (user.plus_settled_at == null || user.plus_settled_at < expiry)
  if (!pending) return user

  const active = await countActivePlants(userId)
  const granted = legacyPotsFor(active)

  // Nunca se resta: si ya tenia heredadas de una suscripcion anterior, se
  // queda con las que mas le favorezcan.
  const legacy = Math.max(user.legacy_plant_slots ?? 0, granted)
  await prisma.user.update({
    where: { id: userId },
    data: { legacy_plant_slots: legacy, plus_settled_at: expiry }
  })
  return { ...user, legacy_plant_slots: legacy }
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
    legacy_pots: plan.legacy_plant_slots ?? 0,
    // El alquiler se manda siempre, tambien con O2+ activo: sigue corriendo
    // aunque ahora mismo no haga falta, y el usuario merece saber cuando
    // vence para no descubrirlo el dia que le falte sitio.
    rental_pots: activeRentalPots(plan, now),
    rental_expires_at: plan.rental_slots_expires_at ?? null,
    plan_expires_at: plan.plan_expires_at,
    is_plus_active: plus,
    plants_used: plants,
    plants_limit: maxPlants(plan, now),
    scans_used_today: scans,
    scans_limit: dailyScanLimit(plan, now)
  }
}
