import { Request, Response, NextFunction } from "express"
import { createTaskUseCase } from "@/application/use-cases/care/create-task.usecase"
import { completeTaskUseCase } from "@/application/use-cases/care/complete-task.usecase"
import { getTasksUseCase } from "@/application/use-cases/care/get-tasks.usecase"
import { createCareLogUseCase } from "@/application/use-cases/care/create-care-log.usecase"
import { getCareLogsUseCase } from "@/application/use-cases/care/get-care-logs.usecase"

export const createTaskController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await createTaskUseCase(req.user!.sub, req.body)
    res.status(201).json(task)
  } catch (error) { next(error) }
}

export const getTasksController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tasks = await getTasksUseCase(req.user!.sub, req.params.plantId as string)
    res.status(200).json(tasks)
  } catch (error) { next(error) }
}

export const completeTaskController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await completeTaskUseCase(req.user!.sub, req.params.taskId as string)
    res.status(200).json(task)
  } catch (error) { next(error) }
}

export const createCareLogController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const log = await createCareLogUseCase(req.user!.sub, req.body)
    res.status(201).json(log)
  } catch (error) { next(error) }
}

export const getCareLogsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await getCareLogsUseCase(req.user!.sub, req.params.plantId as string)
    res.status(200).json(logs)
  } catch (error) { next(error) }
}