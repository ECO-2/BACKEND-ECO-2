import { Request, Response, NextFunction } from "express"
import { identifyPlantUseCase } from "@/application/use-cases/identification/identify-plant.usecase"
import { findIdentificationsByUser } from "@/infrastructure/repositories/identification.repository"

export const identifyPlantController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await identifyPlantUseCase(req.user!.sub, req.body)
    res.status(201).json(result)
  } catch (error) { next(error) }
}

export const getIdentificationsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const identifications = await findIdentificationsByUser(req.user!.sub)
    res.status(200).json(identifications)
  } catch (error) { next(error) }
}