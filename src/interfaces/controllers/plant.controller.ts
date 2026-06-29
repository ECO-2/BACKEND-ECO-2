import { Request, Response, NextFunction } from "express"
import { getAllSpeciesUseCase, getSpeciesByIdUseCase } from "@/application/use-cases/plants/get-species.usecase"
import { createUserPlantUseCase } from "@/application/use-cases/plants/create-user-plant.usecase"
import { getUserPlantsUseCase, getUserPlantByIdUseCase } from "@/application/use-cases/plants/get-user-plants.usecase"
import { updateUserPlantUseCase } from "@/application/use-cases/plants/update-user-plant.usecase"
import { deleteUserPlantUseCase } from "@/application/use-cases/plants/delete-user-plant.usecase"

export const getAllSpeciesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const species = await getAllSpeciesUseCase()
    res.status(200).json(species)
  } catch (error) { next(error) }
}

export const getSpeciesByIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const species = await getSpeciesByIdUseCase(req.params.id as string)
    res.status(200).json(species)
  } catch (error) { next(error) }
}

export const createUserPlantController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plant = await createUserPlantUseCase(req.user!.sub, req.body)
    res.status(201).json(plant)
  } catch (error) { next(error) }
}

export const getUserPlantsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plants = await getUserPlantsUseCase(req.user!.sub)
    res.status(200).json(plants)
  } catch (error) { next(error) }
}

export const getUserPlantByIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plant = await getUserPlantByIdUseCase(req.user!.sub, req.params.id as string)
    res.status(200).json(plant)
  } catch (error) { next(error) }
}

export const updateUserPlantController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plant = await updateUserPlantUseCase(req.user!.sub, req.params.id as string, req.body)
    res.status(200).json(plant)
  } catch (error) { next(error) }
}

export const deleteUserPlantController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteUserPlantUseCase(req.user!.sub, req.params.id as string)
    res.status(204).send()
  } catch (error) { next(error) }
}