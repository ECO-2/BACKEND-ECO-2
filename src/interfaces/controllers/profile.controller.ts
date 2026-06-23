import { Request, Response, NextFunction } from "express"
import { updateProfile } from "@/application/use-cases/update-profile.usecase"

export const updateProfileController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.sub
    const user = await updateProfile(userId, req.body)

    res.status(200).json({
      id: user.id,
      email: user.email,
      username: user.username,
      avatar_url: user.avatar_url,
      notifications_enabled: user.notifications_enabled,
      reminder_start_hour: user.reminder_start_hour,
      reminder_end_hour: user.reminder_end_hour,
      onboarding_completed: user.onboarding_completed,
    })
  } catch (error) {
    next(error)
  }
}