import { Request, Response, NextFunction } from "express"
import {
  getProgressUseCase,
  addXpUseCase,
  addSeedsUseCase,
  updateProgressUseCase,
  getXpLogsUseCase,
  getSeedTransactionsUseCase
} from "@/application/use-cases/gamification/progress.usecase"
import {
  getAllAchievementsUseCase,
  createAchievementUseCase,
  updateAchievementUseCase,
  getUserAchievementsUseCase,
  unlockAchievementUseCase
} from "@/application/use-cases/gamification/achievement.usecase"

export const getProgressController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const progress = await getProgressUseCase(req.user!.sub)
    res.status(200).json(progress)
  } catch (error) { next(error) }
}

export const addXpController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const progress = await addXpUseCase(req.user!.sub, req.body)
    res.status(200).json(progress)
  } catch (error) { next(error) }
}

export const addSeedsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const progress = await addSeedsUseCase(req.user!.sub, req.body)
    res.status(200).json(progress)
  } catch (error) { next(error) }
}

export const updateProgressController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const progress = await updateProgressUseCase(req.user!.sub, req.body)
    res.status(200).json(progress)
  } catch (error) { next(error) }
}

export const getXpLogsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await getXpLogsUseCase(req.user!.sub)
    res.status(200).json(logs)
  } catch (error) { next(error) }
}

export const getSeedTransactionsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transactions = await getSeedTransactionsUseCase(req.user!.sub)
    res.status(200).json(transactions)
  } catch (error) { next(error) }
}

export const getAllAchievementsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const achievements = await getAllAchievementsUseCase()
    res.status(200).json(achievements)
  } catch (error) { next(error) }
}

export const createAchievementController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const achievement = await createAchievementUseCase(req.body)
    res.status(201).json(achievement)
  } catch (error) { next(error) }
}

export const updateAchievementController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const achievement = await updateAchievementUseCase(req.params.id as string, req.body)
    res.status(200).json(achievement)
  } catch (error) { next(error) }
}

export const getUserAchievementsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const achievements = await getUserAchievementsUseCase(req.user!.sub)
    res.status(200).json(achievements)
  } catch (error) { next(error) }
}

export const unlockAchievementController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const achievement = await unlockAchievementUseCase(req.user!.sub, req.params.id as string)
    res.status(201).json(achievement)
  } catch (error) { next(error) }
}