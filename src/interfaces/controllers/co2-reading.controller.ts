import { Request, Response, NextFunction } from "express"
import { createCo2ReadingUseCase } from "@/application/use-cases/co2/create-co2-reading.usecase"
import { getLatestCo2ReadingUseCase } from "@/application/use-cases/co2/get-latest-co2-reading.usecase"
import { getCo2ReadingsUseCase } from "@/application/use-cases/co2/get-co2-readings.usecase"

export const createCo2ReadingController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reading = await createCo2ReadingUseCase(req.body)
    res.status(201).json(reading)
  } catch (error) { next(error) }
}

export const getLatestCo2ReadingController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reading = await getLatestCo2ReadingUseCase(req.user!.sub)
    res.status(200).json(reading)
  } catch (error) { next(error) }
}

export const getCo2ReadingsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const readings = await getCo2ReadingsUseCase(req.user!.sub)
    res.status(200).json(readings)
  } catch (error) { next(error) }
}