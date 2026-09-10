import { prisma } from "@/lib/prisma"

/**
 * Huella verde del usuario: CO2 que fija su jardín.
 *
 * La app mostraba estos números escritos a mano ("12.4 g/día", "36.5 kg"),
 * iguales para todo el mundo. Aquí salen de las plantas reales del usuario y
 * del valor por especie cargado en el catálogo.
 *
 * Cada especie lleva su `co2_evidence_level`, y ese nivel viaja hasta la
 * respuesta: de las 51 especies del catálogo solo 9 son mediciones
 * publicadas y el resto son derivaciones de distinto fundamento. Si la API
 * devolviera solo el número, la app presentaría una inferencia con la misma
 * autoridad que un dato medido.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Niveles que corresponden a una medición publicada de la propia especie. */
const MEASURED_LEVELS = new Set(["medido", "medido_cualitativo"])

/** Respaldo para especies sin valor cargado, a partir del score 0–10. */
export const estimateFromScore = (score: number) => 1.0 + score * 0.4

export const getGreenFootprintUseCase = async (userId: string) => {
  const plants = await prisma.userPlant.findMany({
    where: { user_id: userId, deleted_at: null },
    include: { species: true }
  })

  const now = Date.now()
  let gramsPerDay = 0
  let totalGrams = 0
  let measuredCount = 0
  let derivedCount = 0
  let fallbackCount = 0

  const breakdown = plants.map(plant => {
    const s = plant.species
    const loaded = s.co2_absorption_g_day
    const hasCatalogValue = loaded !== null && loaded !== undefined

    // Sin valor cargado caemos al score, y lo marcamos como tal.
    const level = hasCatalogValue
      ? (s.co2_evidence_level ?? "sin_nivel")
      : "sin_dato_catalogo"

    const daily = hasCatalogValue
      ? Number(loaded)
      : estimateFromScore(s.air_purification_score)

    if (!hasCatalogValue) fallbackCount++
    else if (MEASURED_LEVELS.has(level)) measuredCount++
    else derivedCount++

    const since = plant.acquired_at ?? plant.created_at
    const days = Math.max(0, Math.floor((now - since.getTime()) / MS_PER_DAY))

    gramsPerDay += daily
    totalGrams += daily * days

    return {
      user_plant_id: plant.id,
      nickname: plant.nickname,
      species: s.common_name,
      grams_per_day: Number(daily.toFixed(3)),
      // Un 0 sin contexto parece un dato que falta. Estos campos permiten a la
      // app explicar por qué esa planta no fija CO2 neto en interior.
      is_net_zero: daily === 0,
      is_net_emitter: daily < 0,
      evidence_level: level,
      metabolism: s.metabolism ?? null,
      range_min: s.co2_range_min !== null ? Number(s.co2_range_min) : null,
      range_max: s.co2_range_max !== null ? Number(s.co2_range_max) : null,
      days_in_garden: days,
      total_grams: Number((daily * days).toFixed(2))
    }
  })

  // Evolución de los últimos 7 días. No hay histórico guardado de CO2, pero
  // sí se puede derivar sin inventar nada: cada planta aporta su tasa diaria
  // solo desde el día en que entró a la colección. Así la curva refleja de
  // verdad cómo fue creciendo el jardín, en vez de una serie decorativa.
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfToday.getTime() - (6 - i) * MS_PER_DAY)
    const endOfDay = day.getTime() + MS_PER_DAY

    const grams = plants.reduce((sum, plant) => {
      const since = (plant.acquired_at ?? plant.created_at).getTime()
      if (since >= endOfDay) return sum // ese día aún no estaba en el jardín

      const s = plant.species
      const loaded = s.co2_absorption_g_day
      const daily =
        loaded !== null && loaded !== undefined
          ? Number(loaded)
          : estimateFromScore(s.air_purification_score)
      return sum + daily
    }, 0)

    return { date: day.toISOString().slice(0, 10), grams_per_day: Number(grams.toFixed(3)) }
  })

  return {
    grams_per_day: Number(gramsPerDay.toFixed(3)),
    total_kg: Number((totalGrams / 1000).toFixed(4)),
    plant_count: plants.length,
    last_7_days: last7Days,
    // Desglose de en qué se apoya el total, para que la app pueda decirlo sin
    // tener que interpretar un único campo binario.
    evidence: {
      measured: measuredCount,
      derived: derivedCount,
      fallback: fallbackCount
    },
    // Condición bajo la que son válidos los valores del catálogo.
    reference_conditions:
      "Ejemplar adulto, maceta 10 cm, interior a 20 µmol·m⁻²·s⁻¹ PPFD, " +
      "fotoperiodo 12 h, 21 °C día / 18 °C noche. Valor neto a 24 h.",
    breakdown
  }
}
