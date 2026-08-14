import { Request, Response, NextFunction } from "express"
import { AppError } from "@/core/errors/AppError"

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError("Unauthorized", 401))
  }

  if (req.user.role !== "admin") {
    return next(new AppError("Forbidden", 403))
  }

  next()
}