import { z } from "zod"
import { identifyWithPlantId, isPlantIdConfigured } from "@/lib/plant-id"
import {
  findSpeciesByScientificName,
  createIdentification
} from "@/infrastructure/repositories/identification.repository"
import { assertCanScan } from "@/application/services/plan-limits.service"

const fallbackSchema = z.object({
  image_base64: z.string().min(1),
  image_url: z.string().url().optional()
})

export const identifyWithFallbackUseCase = async (userId: string, input: unknown) => {
  // Tope diario del plan gratuito, antes de gastar la llamada a la IA.
  await assertCanScan(userId)

  const data = fallbackSchema.parse(input)

  if (!isPlantIdConfigured()) {
    // Todavía no hay PLANT_ID_API_KEY configurada — se lo decimos al
    // cliente explícitamente en vez de simular un resultado o fallar
    // con un error genérico.
    return {
      configured: false,
      identification: null,
      species: null,
      low_confidence: true,
      alternates: []
    }
  }

  const result = await identifyWithPlantId(data.image_base64)

  if (!result) {
    const identification = await createIdentification({
      user_id: userId,
      identified_species_id: null,
      confidence_score: 0,
      source: "plant_id_api",
      image_url: data.image_url
    })

    return { configured: true, identification, species: null, low_confidence: true, alternates: [] }
  }

  const species = await findSpeciesByScientificName(result.scientific_name)

  const identification = await createIdentification({
    user_id: userId,
    identified_species_id: species?.id ?? null,
    confidence_score: result.confidence_score,
    source: "plant_id_api",
    image_url: data.image_url
  })

  // Para cada alternativa, buscamos si también está en nuestro catálogo —
  // solo tiene sentido mostrarle al usuario una alternativa que sí pueda
  // agregar a su jardín.
  const alternates = (
    await Promise.all(
      result.alternates.map(async (alt) => {
        const altSpecies = await findSpeciesByScientificName(alt.scientific_name)
        if (!altSpecies) return null
        return { species: altSpecies, confidence_score: alt.confidence_score }
      })
    )
  ).filter((a): a is { species: NonNullable<typeof a>["species"]; confidence_score: number } => a !== null)

  return {
    configured: true,
    identification,
    species,
    low_confidence: result.confidence_score < 0.70,
    plant_id_suggestion: species ? null : {
      scientific_name: result.scientific_name,
      common_name: result.common_name
    },
    alternates
  }
}
