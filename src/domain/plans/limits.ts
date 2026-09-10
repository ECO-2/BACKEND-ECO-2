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

/**
 * Macetas que se conservan al caducar O2+ ("aterrizaje suave").
 *
 * Pasar de ilimitadas a 10 de golpe castiga justo a quien mas uso hizo del
 * plan: se quedaria con plantas que ya no puede cuidar y con la sensacion de
 * haber perdido lo suyo. Con esto conserva hasta 5 macetas por encima del
 * tope gratuito, de forma permanente, y el incentivo a renovar sigue ahi
 * porque a partir de la sexta si necesita O2+.
 *
 * Nunca se borra ni se oculta ninguna planta: el tope solo impide **anadir**.
 */
export const LEGACY_POT_CAP = 5

export interface PlanHolder {
  plan_type: string
  plan_expires_at: Date | null
  /** Macetas extra compradas en la tienda. */
  extra_plant_slots?: number
  rental_plant_slots?: number
  rental_slots_expires_at?: Date | null
  /** Macetas conservadas de una suscripcion O2+ ya caducada. */
  legacy_plant_slots?: number
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

/**
 * Tope de plantas, o null si son ilimitadas.
 *
 * Al tope del plan gratuito se le suman las macetas compradas: las permanentes
 * siempre, y las de alquiler solo mientras no hayan caducado.
 */
export const maxPlants = (user: PlanHolder, now = new Date()): number | null => {
  if (isPlusActive(user, now)) return null

  return (
    FREE_MAX_PLANTS +
    (user.extra_plant_slots ?? 0) +
    (user.legacy_plant_slots ?? 0) +
    activeRentalPots(user, now)
  )
}

/**
 * Macetas de alquiler que siguen vigentes.
 *
 * Un alquiler caducado deja de contar de inmediato, pero las columnas no se
 * limpian: conservarlas permite decirle al usuario que tuvo una y cuando
 * vencio, en vez de que desaparezca sin explicacion.
 */
export const activeRentalPots = (user: PlanHolder, now = new Date()): number => {
  const active =
    user.rental_slots_expires_at != null && user.rental_slots_expires_at > now
  return active ? user.rental_plant_slots ?? 0 : 0
}

/**
 * Macetas que se conservan al caducar O2+, dado cuantas plantas tenia.
 *
 * Se mide contra el tope gratuito y no contra el tope real del usuario: las
 * macetas compradas o alquiladas ya se suman aparte, y contarlas aqui otra vez
 * regalaria el doble de lo prometido.
 */
export const legacyPotsFor = (activePlants: number): number => {
  const over = activePlants - FREE_MAX_PLANTS
  if (over <= 0) return 0
  return Math.min(over, LEGACY_POT_CAP)
}

/**
 * Inicio del día local del servidor, para contar los escaneos "de hoy".
 *
 * Se usa la hora del servidor y no UTC porque el usuario percibe el día por su
 * propio reloj; con UTC el contador se reiniciaría a media tarde en América.
 */
export const startOfToday = (now = new Date()): Date =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate())
