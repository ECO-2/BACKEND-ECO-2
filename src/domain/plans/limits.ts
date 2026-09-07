/**
 * Límites del plan gratuito frente a O2+.
 *
 * Se comprueban contando lo que ya existe (identificaciones de hoy, plantas
 * activas) en vez de llevar contadores en la fila del usuario: así no hay nada
 * que reiniciar a medianoche ni que pueda quedar desincronizado si se borra una
 * planta o falla una petición a medias.
 */

export const PLAN_FREE = "free"
export const PLAN_PLUS = "plus"

/** Escaneos que puede hacer al día una cuenta gratuita. */
export const FREE_DAILY_SCANS = 5

/** Plantas que puede tener a la vez una cuenta gratuita. */
export const FREE_MAX_PLANTS = 10

export interface PlanHolder {
  plan_type: string
  plan_expires_at: Date | null
}

/**
 * O2+ activo. Se exige que la fecha de expiración siga en el futuro: dejar
 * `plan_type = "plus"` sin mirar la fecha convertiría cualquier suscripción
 * caducada en permanente.
 */
export const isPlusActive = (user: PlanHolder, now = new Date()): boolean =>
  user.plan_type === PLAN_PLUS &&
  user.plan_expires_at !== null &&
  user.plan_expires_at > now

/** Tope de escaneos diarios, o null si son ilimitados. */
export const dailyScanLimit = (user: PlanHolder, now = new Date()): number | null =>
  isPlusActive(user, now) ? null : FREE_DAILY_SCANS

/** Tope de plantas, o null si son ilimitadas. */
export const maxPlants = (user: PlanHolder, now = new Date()): number | null =>
  isPlusActive(user, now) ? null : FREE_MAX_PLANTS

/**
 * Inicio del día local del servidor, para contar los escaneos "de hoy".
 *
 * Se usa la hora del servidor y no UTC porque el usuario percibe el día por su
 * propio reloj; con UTC el contador se reiniciaría a media tarde en América.
 */
export const startOfToday = (now = new Date()): Date =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate())
