import { prisma } from "@/lib/prisma"

/**
 * Racha de días consecutivos cuidando plantas.
 *
 * `streak_days` existía en la base de datos y se mostraba en la app, pero
 * **nadie lo incrementaba nunca**: siempre valía 0 por mucho que el usuario
 * regara a diario.
 *
 * La racha se calcula a partir de los CareLog reales, no de un contador que
 * haya que mantener a mano. Así no se descuadra si se registra un cuidado con
 * fecha pasada, si algo falla a mitad, o si el usuario borra un registro.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Fecha a medianoche, para comparar días y no instantes. */
const atMidnight = (d: Date) => {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy
}

/**
 * Cuenta los días consecutivos con al menos un cuidado, terminando hoy o ayer.
 *
 * Se acepta que el último cuidado sea de ayer para no romper la racha de quien
 * todavía no ha regado hoy: la racha se pierde cuando pasa un día entero sin
 * ningún cuidado, no en cuanto cambia la fecha.
 */
export const calculateStreak = async (userId: string): Promise<number> => {
  const logs = await prisma.careLog.findMany({
    where: { user_plant: { user_id: userId } },
    select: { performed_at: true },
    orderBy: { performed_at: "desc" }
  })

  if (logs.length === 0) return 0

  // Días únicos con actividad, del más reciente al más antiguo.
  const days = [...new Set(logs.map(l => atMidnight(l.performed_at).getTime()))]
    .sort((a, b) => b - a)

  const today = atMidnight(new Date()).getTime()
  const gapFromToday = (today - days[0]) / MS_PER_DAY

  // Si el último cuidado es de anteayer o antes, la racha está rota.
  if (gapFromToday > 1) return 0

  let streak = 1
  for (let i = 1; i < days.length; i++) {
    const diff = (days[i - 1] - days[i]) / MS_PER_DAY
    if (diff === 1) streak++
    else break
  }

  return streak
}

/** Recalcula la racha y la guarda. Devuelve el valor resultante. */
export const refreshStreak = async (userId: string): Promise<number> => {
  const streak = await calculateStreak(userId)

  await prisma.userProgress.upsert({
    where: { user_id: userId },
    create: { user_id: userId, streak_days: streak },
    update: { streak_days: streak }
  })

  return streak
}
