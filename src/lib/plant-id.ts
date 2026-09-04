import "dotenv/config"

const PLANT_ID_API_URL = "https://plant.id/api/v3/identification"

export interface PlantIdSuggestion {
  scientific_name: string
  common_name: string
  confidence_score: number
}

export interface PlantIdResult {
  scientific_name: string
  common_name: string
  confidence_score: number
  // Hasta 2 sugerencias alternativas además de la principal, cuando la API
  // las devuelve — reales, no inventadas: vienen directo de la respuesta.
  alternates: PlantIdSuggestion[]
}

/// true si hay una API key configurada (no vacía). Antes de tenerla, el
/// escáner debe mostrar "función no disponible todavía" en vez de intentar
/// la llamada y fallar de forma confusa.
export const isPlantIdConfigured = (): boolean => {
  const key = process.env.PLANT_ID_API_KEY
  return typeof key === "string" && key.trim().length > 0
}

export const identifyWithPlantId = async (imageBase64: string): Promise<PlantIdResult | null> => {
  if (!isPlantIdConfigured()) {
    console.warn("[plant-id] PLANT_ID_API_KEY no está configurada — identificación por IA no disponible.")
    return null
  }

  const response = await fetch(PLANT_ID_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": process.env.PLANT_ID_API_KEY!
    },
    body: JSON.stringify({
      images: [imageBase64]
      // similar_images solo acepta el valor `true` como modifier — la API
      // lo rechaza con 400 si se manda explícitamente en `false`. Se omite
      // por completo; sin él, la API simplemente no incluye ese extra.
    })
  })

  if (!response.ok) {
    console.warn(`[plant-id] La API respondió ${response.status}`)
    return null
  }

  const data = await response.json()

  const suggestions: any[] = data.result?.classification?.suggestions ?? []
  const primary = suggestions[0]

  if (!primary) {
    return null
  }

  const toSuggestion = (s: any): PlantIdSuggestion => ({
    scientific_name: s.name,
    common_name: s.details?.common_names?.[0] ?? s.name,
    confidence_score: s.probability
  })

  return {
    ...toSuggestion(primary),
    alternates: suggestions.slice(1, 3).map(toSuggestion)
  }
}
