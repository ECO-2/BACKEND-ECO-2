import { Request, Response, NextFunction } from "express"
import { ZodError } from "zod"
import { AppError } from "../../core/errors/AppError"

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof ZodError) {
    return res.status(422).json({
      error: "Validation error",
      details: error.issues.map(e => ({
        field: e.path.join("."),
        message: e.message
      }))
    })
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message
    })
  }

  console.error("Unhandled error:", error)
  return res.status(500).json({
    error: "Internal server error"
  })
}