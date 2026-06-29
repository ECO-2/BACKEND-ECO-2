import { findAllSpecies, findSpeciesById } from "@/infrastructure/repositories/plant-species.repository"
import { AppError } from "@/core/errors/AppError"

export const getAllSpeciesUseCase = async () => {
  return findAllSpecies()
}

export const getSpeciesByIdUseCase = async (id: string) => {
  const species = await findSpeciesById(id)
  if (!species) throw new AppError("Species not found", 404)
  return species
}