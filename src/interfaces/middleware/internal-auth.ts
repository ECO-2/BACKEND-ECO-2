import { Request, Response, NextFunction } from "express"
import { AppError } from "@/core/errors/AppError"

export const requireInternalKey = (req: Request, res: Response, next: NextFunction) => {
  const key = req.header("x-internal-key")
  if (!key || key !== process.env.INTERNAL_API_KEY) {
    return next(new AppError("Unauthorized", 401))
  }
  next()
}