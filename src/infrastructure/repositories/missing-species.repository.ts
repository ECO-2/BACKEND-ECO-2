import { prisma } from "@/lib/prisma"

export const recordMissingSpecies = async (scientificName: string, commonName?: string | null) => {
  const normalized = scientificName.trim()

  return prisma.missingSpeciesSuggestion.upsert({
    where: { scientific_name: normalized },
    update: {
      times_requested: { increment: 1 },
      last_requested_at: new Date(),
      // Si la primera vez no vino common_name pero ahora sí, lo completamos.
      ...(commonName ? { common_name: commonName } : {})
    },
    create: {
      scientific_name: normalized,
      common_name: commonName ?? null
    }
  })
}