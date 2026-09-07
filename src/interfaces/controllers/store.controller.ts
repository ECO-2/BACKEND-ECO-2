import { Request, Response, NextFunction } from "express"
import { redeemStoreItemUseCase } from "@/application/use-cases/store/redeem.usecase"

export const redeemStoreItemController = async (
  req: Request, res: Response, next: NextFunction
) => {
  try {
    res.status(200).json(await redeemStoreItemUseCase(req.user!.sub, req.body))
  } catch (error) { next(error) }
}
