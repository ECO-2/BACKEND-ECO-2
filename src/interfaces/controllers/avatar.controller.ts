import { Request, Response, NextFunction } from "express"
import {
  listAvatarsUseCase,
  purchaseAvatarUseCase
} from "@/application/use-cases/avatars/avatars.usecase"

export const listAvatarsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json(await listAvatarsUseCase(req.user!.sub))
  } catch (error) { next(error) }
}

export const purchaseAvatarController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json(await purchaseAvatarUseCase(req.user!.sub, req.body))
  } catch (error) { next(error) }
}
