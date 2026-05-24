import { Request, Response, NextFunction } from "express"
import { verifyAccessToken } from "@/utils/jwt"
import { AppError } from "@/core/errors/AppError"

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("No token provided", 401))
  }

  const token = authHeader.split(" ")[1]

  try {
    (req as any).user = verifyAccessToken(token)
    next()
  } catch {
    next(new AppError("Invalid or expired token", 401))
  }
}