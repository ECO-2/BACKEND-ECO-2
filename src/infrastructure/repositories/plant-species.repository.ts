import { prisma } from "@/lib/prisma"

export const findAllSpecies = async () => {
  return prisma.plantSpecies.findMany({
    orderBy: { common_name: "asc" }
  })
}

export const findSpeciesById = async (id: string) => {
  return prisma.plantSpecies.findUnique({ where: { id } })
}
