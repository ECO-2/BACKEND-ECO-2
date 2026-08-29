import { Request, Response, NextFunction } from "express"
import { runRemindersUseCase } from "@/application/use-cases/run-reminders.usecase"

export const runRemindersController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await runRemindersUseCase()
    res.status(200).json(result)
  } catch (error) { next(error) }
}