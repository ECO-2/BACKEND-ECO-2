import { Request, Response, NextFunction } from "express"
import { completeOnboarding } from "@/application/use-cases/complete-onboarding.usecase"

export const completeOnboardingController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.sub
    const user = await completeOnboarding(userId, req.body)

    res.status(200).json({
      id: user.id,
      email: user.email,
      username: user.username,
      gender: user.gender,
      birth_day: user.birth_day,
      onboarding_completed: user.onboarding_completed
    })
  } catch (error) {
    next(error)
  }
}