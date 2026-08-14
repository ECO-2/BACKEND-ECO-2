import { z } from "zod"
import { AppError } from "@/core/errors/AppError"
import { identifyWithPlantId } from "@/lib/plant-id"
import {
  findSpeciesByScientificName,
  createIdentification
} from "@/infrastructure/repositories/identification.repository"

const fallbackSchema = z.object({
  image_base64: z.string().min(1),
  image_url: z.string().url().optional()
})

export const identifyWithFallbackUseCase = async (userId: string, input: unknown) => {
  const data = fallbackSchema.parse(input)

  const result = await identifyWithPlantId(data.image_base64)

  if (!result) {
    const identification = await createIdentification({
      user_id: userId,
      identified_species_id: null,
      confidence_score: 0,
      source: "plant_id_api",
      image_url: data.image_url
    })

    return { identification, species: null, low_confidence: true }
  }

  const species = await findSpeciesByScientificName(result.scientific_name)

  const identification = await createIdentification({
    user_id: userId,
    identified_species_id: species?.id ?? null,
    confidence_score: result.confidence_score,
    source: "plant_id_api",
    image_url: data.image_url
  })

  return {
    identification,
    species,
    low_confidence: result.confidence_score < 0.70,
    plant_id_suggestion: species ? null : {
      scientific_name: result.scientific_name,
      common_name: result.common_name
    }
  }
}