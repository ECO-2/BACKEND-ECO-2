import { Request, Response, NextFunction } from "express"
import { getPlanStatus } from "@/application/services/plan-limits.service"
import {
  activatePlusUseCase,
  cancelPlusUseCase
} from "@/application/use-cases/plan/activate-plus.usecase"

export const getPlanController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json(await getPlanStatus(req.user!.sub))
  } catch (error) { next(error) }
}

export const activatePlusController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json(await activatePlusUseCase(req.user!.sub, req.body))
  } catch (error) { next(error) }
}

export const cancelPlusController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json(await cancelPlusUseCase(req.user!.sub))
  } catch (error) { next(error) }
}
