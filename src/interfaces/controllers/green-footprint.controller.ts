import { Request, Response, NextFunction } from "express"
import { getGreenFootprintUseCase } from "@/application/use-cases/get-green-footprint.usecase"

export const getGreenFootprintController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const footprint = await getGreenFootprintUseCase(req.user!.sub)
    res.status(200).json(footprint)
  } catch (error) { next(error) }
}
