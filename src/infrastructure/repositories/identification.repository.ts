import { prisma } from "@/lib/prisma"

export const findSpeciesByScientificName = async (scientificName: string) => {
  return prisma.plantSpecies.findUnique({
    where: { scientific_name: scientificName }
  })
}

export const createIdentification = async (data: {
  user_id: string
  identified_species_id: string | null
  confidence_score: number
  source: string
  image_url?: string
}) => {
  return prisma.plantIdentification.create({
    data,
    include: { species: true }
  })
}

export const findIdentificationsByUser = async (userId: string) => {
  return prisma.plantIdentification.findMany({
    where: { user_id: userId },
    include: { species: true },
    orderBy: { created_at: "desc" }
  })
}