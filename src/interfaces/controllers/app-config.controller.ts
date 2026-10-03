import { Request, Response, NextFunction } from "express"
import { getAppConfigUseCase } from "@/application/use-cases/app-config/get-app-config.usecase"

export const getAppConfigController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await getAppConfigUseCase()
    res.status(200).json(config)
  } catch (error) { next(error) }
}