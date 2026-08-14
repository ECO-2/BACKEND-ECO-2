import { z } from "zod"
import { AppError } from "@/core/errors/AppError"
import {
  findSpeciesByScientificName,
  createIdentification
} from "@/infrastructure/repositories/identification.repository"

const CONFIDENCE_THRESHOLD = 0.70

const identifySchema = z.object({
  scientific_name: z.string().min(1),
  confidence_score: z.number().min(0).max(1),
  image_url: z.string().url().optional()
})

export const identifyPlantUseCase = async (userId: string, input: unknown) => {
  const data = identifySchema.parse(input)

  const normalizedName = data.scientific_name.replace(/_/g, " ")

  const species = await findSpeciesByScientificName(normalizedName)

  const identification = await createIdentification({
    user_id: userId,
    identified_species_id: species?.id ?? null,
    confidence_score: data.confidence_score,
    source: "tflite",
    image_url: data.image_url
  })

  const isLowConfidence = data.confidence_score < CONFIDENCE_THRESHOLD

  return {
    identification,
    species,
    low_confidence: isLowConfidence,
    suggest_fallback: isLowConfidence || !species
  }
}