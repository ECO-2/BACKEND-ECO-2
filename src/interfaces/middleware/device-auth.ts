import { Request, Response, NextFunction } from "express"
import { AppError } from "@/core/errors/AppError"

export const requireDeviceKey = (req: Request, res: Response, next: NextFunction) => {
  const key = req.header("x-device-key")
  if (!key || key !== process.env.DEVICE_API_KEY) {
    return next(new AppError("Unauthorized", 401))
  }
  next()
}